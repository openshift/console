package server

import (
	"net/http"
)

type errorEntity struct {
	// Code is the HTTP response status code and will always be populated.
	Code int `json:"code"`
	// Message is the server response message and is only populated when
	// explicitly referenced by the JSON server response.
	Message string `json:"message"`
}

type errorResponse struct {
	Error errorEntity `json:"error"`
}

func sendError(rw http.ResponseWriter, code int, err error) {
	resp := errorResponse{Error: errorEntity{Code: code}}
	if err != nil {
		resp.Error.Message = err.Error()
	}
	sendResponse(rw, code, resp)
}
