package utils

import (
	"mime"
	"net/http"
	"net/url"
	"strings"
)

// fetchShapeHost is a host that serves a chart, index, or provenance file at a
// path with no fetch shape. Add an entry for another host that works the same
// way. The host name must match exactly, ignoring case. The list does not
// exempt the host from the destination check; it only supplies the missing
// shape.
//
// The filename is read from the request URL, because the check runs before
// the request is sent. dispositionParams are query keys whose values are
// Content-Disposition headers. filenameParams are query keys whose values are
// the filename itself. Every one of those parameters that is present must
// name a file of the same shape.
type fetchShapeHost struct {
	host              string
	dispositionParams []string
	filenameParams    []string
}

// fetchShapeHosts are the hosts whose fetch shape can come from a filename
// query parameter. A query string on any other host cannot supply the shape.
var fetchShapeHosts = []fetchShapeHost{
	{
		// GitHub release downloads redirect here. The object path has no
		// suffix. The archive name is in these Content-Disposition values.
		host: "release-assets.githubusercontent.com",
		dispositionParams: []string{
			"rscd",
			"response-content-disposition",
		},
	},
}

// FetchShape reports whether u is an http(s) chart archive, repository index,
// or provenance file. The path is the decoded path, so a query string or
// fragment cannot supply the suffix unless u's host is listed in
// fetchShapeHosts and that path has no shape of its own.
func FetchShape(u *url.URL) string {
	if u == nil || (u.Scheme != "http" && u.Scheme != "https") {
		return ""
	}
	if shape := pathFetchShape(u.Path); shape != "" {
		return shape
	}
	return hostFetchShape(u)
}

func pathFetchShape(path string) string {
	lower := strings.ToLower(path)
	switch {
	case strings.HasSuffix(lower, ".tar.gz"), strings.HasSuffix(lower, ".tgz"):
		return "chart"
	case strings.HasSuffix(path, "/index.yaml"):
		return "index"
	case strings.HasSuffix(path, ".prov"):
		return "prov"
	default:
		return ""
	}
}

// filenameFetchShape classifies a Content-Disposition filename. A bare
// index.yaml has no leading slash, which the path check requires.
func filenameFetchShape(name string) string {
	if shape := pathFetchShape(name); shape != "" {
		return shape
	}
	if name == "index.yaml" {
		return "index"
	}
	return ""
}

func hostFetchShape(u *url.URL) string {
	var spec *fetchShapeHost
	for i := range fetchShapeHosts {
		if strings.EqualFold(fetchShapeHosts[i].host, u.Hostname()) {
			spec = &fetchShapeHosts[i]
			break
		}
	}
	if spec == nil {
		return ""
	}
	names, ok := spec.filenames(u)
	if !ok || len(names) == 0 {
		return ""
	}
	shape := filenameFetchShape(names[0])
	if shape == "" {
		return ""
	}
	for _, name := range names[1:] {
		if filenameFetchShape(name) != shape {
			return ""
		}
	}
	return shape
}

// filenames returns the filenames named by the parameters that are present.
// A present parameter that does not yield a filename makes ok false.
func (h fetchShapeHost) filenames(u *url.URL) ([]string, bool) {
	query := u.Query()
	var names []string
	for _, key := range h.dispositionParams {
		if !query.Has(key) {
			continue
		}
		name, ok := dispositionFilename(query.Get(key))
		if !ok {
			return nil, false
		}
		names = append(names, name)
	}
	for _, key := range h.filenameParams {
		if !query.Has(key) {
			continue
		}
		name := query.Get(key)
		if name == "" {
			return nil, false
		}
		names = append(names, name)
	}
	return names, true
}

func dispositionFilename(value string) (string, bool) {
	_, params, err := mime.ParseMediaType(value)
	if err != nil {
		return "", false
	}
	name := params["filename"]
	if name == "" {
		return "", false
	}
	return name, true
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

// MaxRedirects is the longest redirect chain the repository client follows.
// The chart client uses net/http's default Client, whose limit is also 10,
// so this value has to stay equal to that default. OriginalRequest walks
// this many hops. A shorter walk would compare a later hop with an
// intermediate request.
const MaxRedirects = 10

// OriginalRequest returns the first request in req's redirect chain.
// The walk stops after MaxRedirects hops.
func OriginalRequest(req *http.Request) *http.Request {
	orig := req
	for hops := 0; orig != nil && orig.Response != nil && orig.Response.Request != nil && hops < MaxRedirects; hops++ {
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
