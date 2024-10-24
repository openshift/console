package graphql

import (
	"net/http"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
)

type handler struct {
	relayHandler *relay.Handler
}

func NewHttpHandler(schema *graphql.Schema) *handler {
	h := &handler{
		relayHandler: &relay.Handler{Schema: schema},
	}
	return h
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	h.relayHandler.ServeHTTP(w, r)
}
