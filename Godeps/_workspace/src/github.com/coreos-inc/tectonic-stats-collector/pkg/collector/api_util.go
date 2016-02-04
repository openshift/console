package collector

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/coreos/pkg/httputil"
	"github.com/julienschmidt/httprouter"
	"google.golang.org/api/googleapi"
)

// WriteError builds an errorResponse entity from the given arguments,
// serializing the object into the provided http.ResponseWriter
func WriteError(w http.ResponseWriter, code int, err error) error {
	resp := &errorResponse{Error: WrapError(code, err)}
	return httputil.WriteJSONResponse(w, code, resp)
}

// ContentTypeMiddleware wraps and returns a httprouter.Handle, validating the request
// content type is compatible with the contentTypes list.
// It writes a HTTP 415 error if that fails.
//
// Only PUT, POST, and PATCH requests are considered.
func ContentTypeMiddleware(handle httprouter.Handle, contentTypes ...string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		if !(r.Method == "PUT" || r.Method == "POST" || r.Method == "PATCH") {
			handle(w, r, p)
			return
		}

		for _, ct := range contentTypes {
			if isContentType(r.Header, ct) {
				handle(w, r, p)
				return
			}
		}
		msg := fmt.Sprintf("Unsupported content type %q; expected one of %q", r.Header.Get("Content-Type"), contentTypes)
		http.Error(w, msg, http.StatusUnsupportedMediaType)
	}
}

// isContentType validates the Content-Type header
// is contentType. That is, its type and subtype match.
func isContentType(h http.Header, contentType string) bool {
	ct := h.Get("Content-Type")
	if i := strings.IndexRune(ct, ';'); i != -1 {
		ct = ct[0:i]
	}
	return ct == contentType
}

// errorResponse is a fork of "google.golang.org/api/googleapi".errorReply
type errorResponse struct {
	Error *googleapi.Error `json:"error"`
}

func WrapError(code int, err error) *googleapi.Error {
	newError := &googleapi.Error{Code: code}
	if err != nil {
		newError.Message = err.Error()
	}
	return newError
}
