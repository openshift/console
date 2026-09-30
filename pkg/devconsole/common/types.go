package common

import (
	"fmt"
	"net/http"
)

type DevConsoleCommonResponse struct {
	StatusCode int         `json:"statusCode"`
	Headers    http.Header `json:"headers"`
	Body       string      `json:"body"`
}

type ValidationError struct {
	Err error
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error: %v", e.Err)
}

func (e *ValidationError) Unwrap() error {
	return e.Err
}
