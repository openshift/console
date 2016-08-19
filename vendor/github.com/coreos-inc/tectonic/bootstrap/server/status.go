package server

import (
	"net/http"

	"golang.org/x/net/context"

	"github.com/coreos-inc/tectonic/bootstrap/server/ctxh"
)

// statusHandler returns the status of the created cluster. Not implemented.
func statusHandler(s Store) ctxh.ContextHandler {
	fn := func(ctx context.Context, w http.ResponseWriter, req *http.Request) *ctxh.AppError {
		cluster, ok := s.GetCluster("bootkube")
		if !ok {
			http.Error(w, "no cluster to monitor", http.StatusNotFound)
			return nil
		}
		b, err := cluster.Health()
		if err != nil {
			return ctxh.NewAppError(nil, "failed to check cluster health", http.StatusInternalServerError)
		}
		writeJSON(w, b)
		return nil
	}
	return ctxh.ContextHandlerFuncWithError(fn)
}

// writeJSON writes the given bytes with a JSON Content-Type.
func writeJSON(w http.ResponseWriter, data []byte) {
	w.Header().Set("Content-Type", "application/json")
	_, err := w.Write(data)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	}
}
