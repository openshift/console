package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
)

var rpcCodeToHttpStatus = map[codes.Code]int{
	codes.AlreadyExists:    http.StatusBadRequest,
	codes.DeadlineExceeded: http.StatusRequestTimeout,
	codes.Internal:         http.StatusInternalServerError,
	codes.InvalidArgument:  http.StatusBadRequest,
	codes.NotFound:         http.StatusNotFound,
	codes.PermissionDenied: http.StatusForbidden,
	codes.Unauthenticated:  http.StatusUnauthorized,
	codes.Unavailable:      http.StatusServiceUnavailable,
	codes.Unimplemented:    http.StatusNotImplemented,
}

var httpStatusToLabel = map[int]string{
	http.StatusBadRequest:          "bad_request",
	http.StatusRequestTimeout:      "request_timeout",
	http.StatusInternalServerError: "server_error",
	http.StatusNotFound:            "not_found",
	http.StatusForbidden:           "permission_denied",
	http.StatusUnauthorized:        "unauthenticated",
	http.StatusServiceUnavailable:  "unavailable",
	http.StatusNotImplemented:      "unimplemented",
}

type PublicError struct {
	HTTPStatus int
	Inner      error
	Desc       string
}

func (e PublicError) Error() string {
	return fmt.Sprintf("%s: %v", e.PublicLabel(), e.Inner)
}

func (e PublicError) PublicLabel() string {
	label := "server_error"
	if mappedLabel, ok := httpStatusToLabel[e.HTTPStatus]; ok {
		label = mappedLabel
	}
	return label
}

func (e PublicError) PublicDesc() string {
	return e.Desc
}

func (e PublicError) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]string{
		"error":       e.PublicLabel(),
		"description": e.PublicDesc(),
	})
}

func convertToPublicError(err error) PublicError {
	perr, ok := err.(PublicError)
	if ok {
		return perr
	}

	httpStatus := http.StatusInternalServerError
	grpcCode := grpc.Code(err)
	if mappedHttpStatus, ok := rpcCodeToHttpStatus[grpcCode]; ok {
		httpStatus = mappedHttpStatus
	}

	desc := "An unknown server error occurred."
	grpcDesc := grpc.ErrorDesc(err)
	if grpcDesc != "" {
		desc = grpcDesc
	}

	return PublicError{
		HTTPStatus: httpStatus,
		Inner:      err,
		Desc:       desc,
	}
}

func writeError(w http.ResponseWriter, err error) {
	perr := convertToPublicError(err)
	writeResponseWithBody(w, perr.HTTPStatus, perr)
}
