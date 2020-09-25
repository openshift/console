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
		headers, ok := ctx.Value(HeadersKey).(map[string]string)
		if ok {
			for key, value := range headers {
				if value != "" {
					request.Header.Add(key, value)
				}
			}
		}
	}
}

type initPayload struct {
	ImpersonateUser  string `json:"Impersonate-User"`
	ImpersonateGroup string `json:"Impersonate-Group"`
}

func InitPayload(ctx context.Context, payload json.RawMessage) context.Context {
	initPayload := initPayload{}
	err := json.Unmarshal(payload, &initPayload)
	if err != nil {
		return ctx
	}
	headers, ok := ctx.Value(HeadersKey).(map[string]string)
	if ok {
		headers["Impersonate-User"] = initPayload.ImpersonateUser
		headers["Impersonate-Group"] = initPayload.ImpersonateGroup
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
