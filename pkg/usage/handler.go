package usage

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/serverutils"
)

type Request struct {
	Event       string `json:"event"`
	Perspective string `json:"perspective"`
}

func Handle(metrics *Metrics, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Unsupported method, supported methods are POST"})
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}

	if req.Event == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "Event type is required"})
		return
	}
	if req.Perspective == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "Perspective is required"})
		return
	}
	if err := metrics.HandleUsage(req.Event, req.Perspective); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to handle page view: %v", err)})
		return
	}
	w.WriteHeader(http.StatusAccepted)
}
