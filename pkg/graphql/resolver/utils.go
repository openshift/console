package resolver

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

const HeadersKey string = "headers"

func contextToHeaders(ctx context.Context, request *http.Request) {
	if ctx.Value(HeadersKey) != nil {
		headers, ok := ctx.Value(HeadersKey).(map[string]interface{})
		if ok {
			for key, value := range headers {
				switch v := value.(type) {
				case string:
					if v != "" {
						request.Header.Add(key, v)
					}
				case []string:
					// Handle multiple values for the same header (e.g., Impersonate-Group)
					for _, val := range v {
						if val != "" {
							request.Header.Add(key, val)
						}
					}
				}
			}
		}
	}
}

type initPayload struct {
	ImpersonateUser  string   `json:"Impersonate-User"`
	ImpersonateGroup []string `json:"-"` // Populated by UnmarshalJSON
}

// UnmarshalJSON implements custom unmarshaling to handle Impersonate-Group
// as either a string (single group) or array (multiple groups)
func (ip *initPayload) UnmarshalJSON(data []byte) error {
	type Alias initPayload
	aux := &struct {
		ImpersonateGroupRaw json.RawMessage `json:"Impersonate-Group"`
		*Alias
	}{
		Alias: (*Alias)(ip),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Handle Impersonate-Group as string or array
	if len(aux.ImpersonateGroupRaw) > 0 {
		// Try array first
		var groups []string
		if err := json.Unmarshal(aux.ImpersonateGroupRaw, &groups); err == nil {
			ip.ImpersonateGroup = groups
		} else {
			// Try string
			var group string
			if err := json.Unmarshal(aux.ImpersonateGroupRaw, &group); err == nil && group != "" {
				ip.ImpersonateGroup = []string{group}
			}
		}
	}

	return nil
}

func InitPayload(ctx context.Context, payload json.RawMessage) context.Context {
	initPayload := initPayload{}
	err := json.Unmarshal(payload, &initPayload)
	if err != nil {
		return ctx
	}
	headers, ok := ctx.Value(HeadersKey).(map[string]interface{})
	if ok {
		if initPayload.ImpersonateUser != "" {
			headers["Impersonate-User"] = initPayload.ImpersonateUser
		}
		// Handle groups (supports both single and multiple groups)
		if len(initPayload.ImpersonateGroup) > 0 {
			groups := initPayload.ImpersonateGroup
			groups = append(groups, "system:authenticated")
			headers["Impersonate-Group"] = groups
		}
		ctx = context.WithValue(ctx, HeadersKey, headers)
	}
	return ctx
}

type resolverError struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

func (e resolverError) Error() string {
	return fmt.Sprintf("error [%q]: %s", e.Status, e.Message)
}
func (e resolverError) Extensions() map[string]interface{} {
	return map[string]interface{}{
		"status":  e.Status,
		"message": e.Message,
	}
}
