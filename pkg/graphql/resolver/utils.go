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
	ImpersonateUser   string   `json:"Impersonate-User"`
	ImpersonateGroup  string   `json:"Impersonate-Group"`
	ImpersonateGroups []string `json:"Impersonate-Groups"`
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
		// Support both single group (backward compatibility) and multiple groups
		if len(initPayload.ImpersonateGroups) > 0 {
			groups := initPayload.ImpersonateGroups
			groups = append(groups, "system:authenticated")
			headers["Impersonate-Group"] = groups
		} else if initPayload.ImpersonateGroup != "" {
			headers["Impersonate-Group"] = []string{initPayload.ImpersonateGroup, "system:authenticated"}
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
