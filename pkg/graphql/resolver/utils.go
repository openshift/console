package resolver

import (
	"context"
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
