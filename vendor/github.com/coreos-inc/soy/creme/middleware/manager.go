package middleware

import (
	"errors"
	"net/http"
	"sync"

	"golang.org/x/net/context"
	"gopkg.in/julienschmidt/httprouter.v1"
)

const (
	ErrorKey = "error"
)

type ErrorWriter func(http.ResponseWriter, error)

// Middleware Manager is responsible for: creating/destroying request contexts,
// getting/setting values from contexts, and helpers to wrap handlers in middleware.
type Manager struct {
	ctxMap     map[*http.Request]*context.Context
	ctxMapLock sync.Mutex
	errWriter  ErrorWriter
}

func NewManager(ew ErrorWriter) *Manager {
	return &Manager{
		ctxMap:    make(map[*http.Request]*context.Context),
		errWriter: ew,
	}
}

func (m *Manager) ContextFromRequest(r *http.Request) *context.Context {
	m.ctxMapLock.Lock()
	defer m.ctxMapLock.Unlock()
	return m.ctxMap[r]
}

func (m *Manager) contextWrapper(h httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		ctx := context.Background()
		m.ctxMapLock.Lock()
		m.ctxMap[r] = &ctx
		m.ctxMapLock.Unlock()

		h(w, r, ps)

		m.ctxMapLock.Lock()
		delete(m.ctxMap, r)
		m.ctxMapLock.Unlock()
	}
}

func (m *Manager) Chain(handlers ...httprouter.Handle) httprouter.Handle {
	return m.contextWrapper(
		func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
			for _, handler := range handlers {
				handler(w, r, ps)
				if err := m.GetValue(r, ErrorKey); err != nil {
					e, ok := err.(error)
					if ok {
						m.errWriter(w, e)
					} else {
						m.errWriter(w, errors.New("unknown middleware error"))
					}
					return
				}
			}
		})
}

func (m *Manager) SetError(r *http.Request, err error) {
	ctx := m.ContextFromRequest(r)
	*ctx = context.WithValue(*ctx, ErrorKey, err)
}

func (m *Manager) SetValue(r *http.Request, key interface{}, value interface{}) {
	ctx := m.ContextFromRequest(r)
	*ctx = context.WithValue(*ctx, key, value)
}

func (m *Manager) GetValue(r *http.Request, key interface{}) interface{} {
	ctx := m.ContextFromRequest(r)
	return (*ctx).Value(key)
}
