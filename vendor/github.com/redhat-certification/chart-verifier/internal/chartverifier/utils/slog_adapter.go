package utils

import (
	"bytes"
	"context"
	"log/slog"
	"strings"
	"sync"
)

// adapter is a slogHandler singleton, initialized via the SlogHandler function.
var adapter *slogHandler

func initSlogHandler(suppressLogs bool) {
	b := bytes.NewBuffer([]byte{})
	if adapter == nil {
		textHandler := slog.NewTextHandler(b, &slog.HandlerOptions{
			Level: slog.LevelDebug,
			ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
				if a.Key == slog.TimeKey || a.Key == slog.LevelKey {
					return slog.Attr{}
				}
				return a
			},
		})

		adapter = &slogHandler{
			handler:    textHandler,
			suppressed: suppressLogs,
			buffer:     b,
			mu:         &sync.Mutex{},
		}
	}
}

// SlogHandler will return the package handler, or initialize a suppressed one
// if this is called before initialization to avoid return a nil handler.
//
// This handler is considered an adapter for the project-level logging
// functionality, and therefore initSlogHandler should be called before
// requesting a handler for proper alignment between the primary logging
// functions and this adapter.
func SlogHandler() *slogHandler {
	if adapter == nil {
		suppressLogs := true
		initSlogHandler(suppressLogs)
	}
	return adapter
}

// Ensure the adapter implements the slog.Handler interface.
var _ slog.Handler = &slogHandler{}

type slogHandler struct {
	handler    slog.Handler
	suppressed bool
	buffer     *bytes.Buffer
	mu         *sync.Mutex
}

// Suppress sets whether or not to suppress these logs. Implemented by
// disabling the slog.Handler.
func (h *slogHandler) Suppress(b bool) {
	h.suppressed = b
}

func (h *slogHandler) IsSuppressed() bool {
	return h.suppressed
}

func (h *slogHandler) Enabled(_ context.Context, _ slog.Level) bool {
	return !h.suppressed
}

func (h *slogHandler) Handle(ctx context.Context, record slog.Record) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	err := h.handler.Handle(ctx, record)
	if err != nil {
		return err
	}

	LogInfo(strings.TrimSpace(h.buffer.String()))
	h.buffer.Reset()
	return nil
}

func (h *slogHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &slogHandler{
		handler:    h.handler.WithAttrs(attrs),
		suppressed: h.suppressed,
		buffer:     h.buffer,
		mu:         h.mu,
	}
}

func (h *slogHandler) WithGroup(name string) slog.Handler {
	return &slogHandler{
		handler:    h.handler.WithGroup(name),
		suppressed: h.suppressed,
		buffer:     h.buffer,
		mu:         h.mu,
	}
}
