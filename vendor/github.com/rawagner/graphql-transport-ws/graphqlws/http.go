package graphqlws

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/rawagner/graphql-transport-ws/graphqlws/internal/connection"
)

// ProtocolGraphQLWS is websocket subprotocol ID for GraphQL over WebSocket
// see https://github.com/apollographql/subscriptions-transport-ws
const ProtocolGraphQLWS = "graphql-ws"

var defaultUpgrader = websocket.Upgrader{
	CheckOrigin:  func(r *http.Request) bool { return true },
	Subprotocols: []string{ProtocolGraphQLWS},
}

type handler struct {
	Upgrader    websocket.Upgrader
	InitPayload connection.InitPayload
}

// NewHandlerFunc returns an http.HandlerFunc that supports GraphQL over websockets
func NewHandlerFunc(svc connection.GraphQLService, httpHandler http.Handler) http.HandlerFunc {
	handler := NewHandler()
	return handler.NewHandlerFunc(svc, httpHandler)
}

func NewHandler() handler {
	initPayload := func(ctx context.Context, payload json.RawMessage) context.Context {
		return ctx
	}
	return handler{InitPayload: initPayload, Upgrader: defaultUpgrader}
}

func (h *handler) NewHandlerFunc(svc connection.GraphQLService, httpHandler http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		for _, subprotocol := range websocket.Subprotocols(r) {
			if subprotocol == "graphql-ws" {
				ws, err := h.Upgrader.Upgrade(w, r, nil)
				if err != nil {
					return
				}

				if ws.Subprotocol() != ProtocolGraphQLWS {
					ws.Close()
					return
				}

				go connection.Connect(r.Context(), ws, svc, h.InitPayload)
				return
			}
		}

		// Fallback to HTTP
		httpHandler.ServeHTTP(w, r)
	}
}
