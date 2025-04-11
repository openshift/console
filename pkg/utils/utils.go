package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"sort"
	"strings"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverconfig"
)

const (
	baseURI        = "base-uri"
	defaultSrc     = "default-src"
	imgSrc         = "img-src"
	fontSrc        = "font-src"
	scriptSrc      = "script-src"
	styleSrc       = "style-src"
	connectSrc     = "connect-src"
	frameSrc       = "frame-src"
	frameAncestors = "frame-ancestors"
	consoleDot     = "console.redhat.com"
	httpLocalHost  = "http://localhost:8080"
	wsLocalHost    = "ws://localhost:8080"
	self           = "'self'"
	data           = "data:"
	unsafeEval     = "'unsafe-eval'"
	unsafeInline   = "'unsafe-inline'"
	none           = "'none'"
)

// RandomBytes generates a cryptographically secure random array of bytes.
func RandomBytes(length int) ([]byte, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	return bytes, err
}

// RandomString generates a cryptographically secure random string.
// The returned string is encoded using base64.RawURLEncoding, making it safe for URLs and file names.
func RandomString(length int) (string, error) {
	encoding := base64.RawURLEncoding
	b64size := encoding.DecodedLen(length) + 1 // Account for base64 encoding overhead
	randomBytes, err := RandomBytes(b64size)
	if err != nil {
		return "", err
	}
	return encoding.EncodeToString(randomBytes)[:length], nil
}

// BuildCSPDirectives constructs a complete set of Content Security Policy (CSP) directives
// based on the provided configuration and mode.
func BuildCSPDirectives(k8sMode string, pluginsCSP serverconfig.MultiKeyValue, indexPageScriptNonce, cspReportingEndpoint string) ([]string, error) {
	nonce := fmt.Sprintf("'nonce-%s'", indexPageScriptNonce)

	// Initialize directives with default values
	// When running on-cluster, the default sources are just 'self' and 'console.redhat.com'.
	// When running off-cluster, 'http://localhost:8080' and 'ws://localhost:8080' are appended to the
	// default sources. Image source, font source, and style source only use 'self' and
	directives := map[string][]string{
		baseURI:        {self},
		defaultSrc:     {self},
		imgSrc:         {self},
		fontSrc:        {self},
		scriptSrc:      {self, consoleDot},
		styleSrc:       {self},
		connectSrc:     {self, consoleDot},
		frameSrc:       {none},
		frameAncestors: {none},
	}

	// Append localhost sources if running off-cluster
	if k8sMode == "off-cluster" {
		directives[baseURI] = append(directives[baseURI], httpLocalHost, wsLocalHost)
		directives[defaultSrc] = append(directives[defaultSrc], httpLocalHost, wsLocalHost)
		directives[imgSrc] = append(directives[imgSrc], httpLocalHost)
		directives[fontSrc] = append(directives[fontSrc], httpLocalHost)
		directives[scriptSrc] = append(directives[scriptSrc], httpLocalHost, wsLocalHost)
		directives[styleSrc] = append(directives[styleSrc], httpLocalHost)
	}

	// Merge plugin CSP configuration into directives
	for directive, sources := range pluginsCSP {
		switch directive {
		case defaultSrc:
			directives[defaultSrc] = append(directives[defaultSrc], sources)
		case imgSrc:
			directives[imgSrc] = append(directives[imgSrc], sources)
		case fontSrc:
			directives[fontSrc] = append(directives[fontSrc], sources)
		case scriptSrc:
			directives[scriptSrc] = append(directives[scriptSrc], sources)
		case styleSrc:
			directives[styleSrc] = append(directives[styleSrc], sources)
		case connectSrc:
			directives[connectSrc] = append(directives[connectSrc], sources)
		default:
			klog.Errorf("ignored unsupported CSP directive: %v", directive)
			return nil, fmt.Errorf("unsupported CSP directive: %v", directive)
		}
	}

	// Append additional sources to directives
	directives[imgSrc] = append(directives[imgSrc], data)
	directives[fontSrc] = append(directives[fontSrc], data)
	directives[scriptSrc] = append(directives[scriptSrc], unsafeEval, nonce)
	directives[styleSrc] = append(directives[styleSrc], unsafeInline)

	// Sort the directives to ensure the same order every time
	var directiveKeys []string
	for key := range directives {
		directiveKeys = append(directiveKeys, key)
	}
	sort.Strings(directiveKeys)

	// Construct the final CSP header
	var cspDirectives []string
	for _, directive := range directiveKeys {
		cspDirectives = append(cspDirectives, fmt.Sprintf("%s %s", directive, strings.Join(directives[directive], " ")))
	}

	// Support using client provided CSP reporting endpoint for testing purposes.
	if cspReportingEndpoint != "" {
		cspDirectives = append(cspDirectives, fmt.Sprintf("report-uri %s", cspReportingEndpoint))
	}

	return cspDirectives, nil
}
