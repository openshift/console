package main

import (
	"bytes"
	"flag"
	"strings"
	"testing"

	"k8s.io/klog/v2"
)

func TestKlogWriter_TLSHandshakeError_SuppressedAtDefaultVerbosity(t *testing.T) {
	var buf bytes.Buffer
	fs := flag.NewFlagSet("test", flag.ContinueOnError)
	klog.InitFlags(fs)
	// Default verbosity is 0, so V(4) messages should be suppressed.
	if err := fs.Set("v", "0"); err != nil {
		t.Fatalf("failed to set verbosity: %v", err)
	}
	klog.SetOutput(&buf)
	defer klog.SetOutput(nil)

	w := klogWriter{}
	msg := "http: TLS handshake error from 10.0.0.1:12345: EOF\n"
	n, err := w.Write([]byte(msg))
	klog.Flush()

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if n != len(msg) {
		t.Errorf("expected %d bytes written, got %d", len(msg), n)
	}
	if strings.Contains(buf.String(), "TLS handshake error") {
		t.Errorf("TLS handshake error should be suppressed at default verbosity, got: %s", buf.String())
	}
}

func TestKlogWriter_TLSHandshakeError_VisibleAtVerbosity4(t *testing.T) {
	var buf bytes.Buffer
	fs := flag.NewFlagSet("test", flag.ContinueOnError)
	klog.InitFlags(fs)
	if err := fs.Set("v", "4"); err != nil {
		t.Fatalf("failed to set verbosity: %v", err)
	}
	klog.SetOutput(&buf)
	defer func() {
		klog.SetOutput(nil)
		// Reset verbosity to avoid affecting other tests.
		fs2 := flag.NewFlagSet("reset", flag.ContinueOnError)
		klog.InitFlags(fs2)
		_ = fs2.Set("v", "0")
	}()

	w := klogWriter{}
	msg := "http: TLS handshake error from 10.0.0.1:12345: EOF\n"
	n, err := w.Write([]byte(msg))
	klog.Flush()

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if n != len(msg) {
		t.Errorf("expected %d bytes written, got %d", len(msg), n)
	}
	if !strings.Contains(buf.String(), "TLS handshake error") {
		t.Errorf("TLS handshake error should be visible at V(4), got: %s", buf.String())
	}
}

func TestKlogWriter_NonTLSError_AlwaysLogged(t *testing.T) {
	var buf bytes.Buffer
	fs := flag.NewFlagSet("test", flag.ContinueOnError)
	klog.InitFlags(fs)
	if err := fs.Set("v", "0"); err != nil {
		t.Fatalf("failed to set verbosity: %v", err)
	}
	klog.SetOutput(&buf)
	defer klog.SetOutput(nil)

	w := klogWriter{}
	msg := "http: Accept error: accept tcp [::]:8443: use of closed network connection\n"
	n, err := w.Write([]byte(msg))
	klog.Flush()

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if n != len(msg) {
		t.Errorf("expected %d bytes written, got %d", len(msg), n)
	}
	if !strings.Contains(buf.String(), "Accept error") {
		t.Errorf("non-TLS errors should always be logged, got: %s", buf.String())
	}
}
