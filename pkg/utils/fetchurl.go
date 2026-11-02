package utils

import (
	"net/http"
	"net/url"
	"strings"
)

// FetchShape reports whether u is an http(s) chart archive, repository index,
// or provenance file. The path is the decoded path, so a query string or
// fragment cannot supply the suffix.
func FetchShape(u *url.URL) string {
	if u == nil || (u.Scheme != "http" && u.Scheme != "https") {
		return ""
	}
	lower := strings.ToLower(u.Path)
	switch {
	case strings.HasSuffix(lower, ".tar.gz"), strings.HasSuffix(lower, ".tgz"):
		return "chart"
	case strings.HasSuffix(u.Path, "/index.yaml"):
		return "index"
	case strings.HasSuffix(lower, ".prov"):
		return "prov"
	default:
		return ""
	}
}

// FetchShapePreserved reports whether req has a fetch shape and, when it is a
// redirect, keeps the shape of the first request in the chain.
func FetchShapePreserved(req *http.Request) bool {
	if req == nil || req.URL == nil {
		return false
	}
	shape := FetchShape(req.URL)
	if shape == "" {
		return false
	}
	orig := OriginalRequest(req)
	if orig == nil || orig.URL == nil || orig == req {
		return true
	}
	return FetchShape(orig.URL) == shape
}

// OriginalRequest returns the first request in req's redirect chain.
func OriginalRequest(req *http.Request) *http.Request {
	orig := req
	for hops := 0; orig != nil && orig.Response != nil && orig.Response.Request != nil && hops < 10; hops++ {
		orig = orig.Response.Request
	}
	return orig
}

// HTTPSDowngraded reports whether the first request in the chain is https and
// req is http.
func HTTPSDowngraded(req *http.Request) bool {
	if req == nil || req.URL == nil {
		return false
	}
	orig := OriginalRequest(req)
	if orig == nil || orig.URL == nil {
		return false
	}
	return orig.URL.Scheme == "https" && req.URL.Scheme == "http"
}
