// Package httptransport contains a builder that can be used to build an http.RoundTripper.
// Particularly the package supports registering dynamic CA bundle sources that are being watched
// and any change causes the RoundTripper to be rebuilt in the background and atomically replaced.
// If a rebuild fails, the previous RoundTripper is kept and the error is logged.
//
// The concrete type of the returned RoundTripper is not part of the API: it is a wrapper when
// dynamic CA bundle sources are used, so callers must not type-assert it to *http.Transport.
// See NewRoundTripper.
package httptransport
