package utils

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"k8s.io/klog/v2"

	consolev1 "github.com/openshift/api/console/v1"
)

const (
	baseURI       = "base-uri"
	defaultSrc    = "default-src"
	imgSrc        = "img-src"
	fontSrc       = "font-src"
	scriptSrc     = "script-src"
	styleSrc      = "style-src"
	consoleDot    = "console.redhat.com"
	httpLocalHost = "http://localhost:8080"
	wsLocalHost   = "ws://localhost:8080"
	self          = "'self'"
	data          = "data:"
	unsafeEval    = "'unsafe-eval'"
	unsafeInline  = "'unsafe-inline'"
)

// Generate a cryptographically secure random array of bytes.
func RandomBytes(length int) ([]byte, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	return bytes, err
}

// Generate a cryptographically secure random string.
// Returned string is encoded using [encoding.RawURLEncoding]
// which makes it safe to use in URLs and file names.
func RandomString(length int) (string, error) {
	encoding := base64.RawURLEncoding
	// each byte (8 bits) gives us 4/3 base64 (6 bits) characters,
	// we account for that conversion and add one to handle truncation
	b64size := encoding.DecodedLen(length) + 1
	randomBytes, err := RandomBytes(b64size)
	if err != nil {
		return "", err
	}
	// trim down to the original requested size since we added one above
	return encoding.EncodeToString(randomBytes)[:length], nil
}

// buildCSPDirectives takes the content security policy configuration from the server and constructs
// a complete set of directives for the Content-Security-Policy-Report-Only header.
// The constructed directives will include the default sources and the supplied configuration.

func BuildCSPDirectives(k8sMode, pluginsCSP, indexPageScriptNonce string) ([]string, error) {
	nonce := fmt.Sprintf("'nonce-%s'", indexPageScriptNonce)

	// The default sources are the sources that are allowed for all directives.
	// When running on-cluster, the default sources are just 'self' and 'console.redhat.com'.
	// When running off-cluster, 'http://localhost:8080' and 'ws://localhost:8080' are appended to the
	// default sources. Image source, font source, and style source only use 'self' and
	// 'http://localhost:8080'.
	baseUriDirective := []string{baseURI, self}
	defaultSrcDirective := []string{defaultSrc, self, consoleDot}
	imgSrcDirective := []string{imgSrc, self}
	fontSrcDirective := []string{fontSrc, self}
	scriptSrcDirective := []string{scriptSrc, self, consoleDot}
	styleSrcDirective := []string{styleSrc, self}
	if k8sMode == "off-cluster" {
		baseUriDirective = append(baseUriDirective, []string{httpLocalHost, wsLocalHost}...)
		defaultSrcDirective = append(defaultSrcDirective, []string{httpLocalHost, wsLocalHost}...)
		imgSrcDirective = append(imgSrcDirective, httpLocalHost)
		fontSrcDirective = append(fontSrcDirective, httpLocalHost)
		scriptSrcDirective = append(scriptSrcDirective, []string{httpLocalHost, wsLocalHost}...)
		styleSrcDirective = append(styleSrcDirective, httpLocalHost)
	}

	// If the plugins are providing a content security policy configuration, parse it and add it to
	// the appropriate directive. The configuration is a string that is parsed into a map of directive types to sources.
	// The sources are added to the existing sources for each type.
	if pluginsCSP != "" {
		parsedCSP, err := ParseContentSecurityPolicyConfig(pluginsCSP)
		if err != nil {
			return nil, err
		}
		for directive, sources := range *parsedCSP {
			switch directive {
			case consolev1.DefaultSrc:
				defaultSrcDirective = append(defaultSrcDirective, sources...)
			case consolev1.ImgSrc:
				imgSrcDirective = append(imgSrcDirective, sources...)
			case consolev1.FontSrc:
				fontSrcDirective = append(fontSrcDirective, sources...)
			case consolev1.ScriptSrc:
				scriptSrcDirective = append(scriptSrcDirective, sources...)
			case consolev1.StyleSrc:
				styleSrcDirective = append(styleSrcDirective, sources...)
			default:
				klog.Warningf("ignored invalid CSP directive: %v", directive)
			}
		}
	}

	imgSrcDirective = append(imgSrcDirective, data)
	fontSrcDirective = append(fontSrcDirective, data)
	scriptSrcDirective = append(scriptSrcDirective, []string{unsafeEval, nonce}...)
	styleSrcDirective = append(styleSrcDirective, unsafeInline)

	// Construct the full list of directives from the aggregated sources.
	// This array is a list of directives, where each directive is a string
	// of the form "<directive-type> <sources>".
	// The sources are concatenated together with a space separator.
	// The CSP directives string is returned as a slice of strings, where each string is a directive.
	return []string{
		strings.Join(baseUriDirective, " "),
		strings.Join(defaultSrcDirective, " "),
		strings.Join(imgSrcDirective, " "),
		strings.Join(fontSrcDirective, " "),
		strings.Join(scriptSrcDirective, " "),
		strings.Join(styleSrcDirective, " "),
		"frame-src 'none'",
		"frame-ancestors 'none'",
		"object-src 'none'",
	}, nil
}

func ParseContentSecurityPolicyConfig(csp string) (*map[consolev1.DirectiveType][]string, error) {
	parsedCSP := &map[consolev1.DirectiveType][]string{}
	err := json.Unmarshal([]byte(csp), parsedCSP)
	if err != nil {
		errMsg := fmt.Sprintf("Error unmarshaling ConsoleConfig contentSecurityPolicy field: %v", err)
		klog.Error(errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	// Validate the keys to ensure they are all valid DirectiveTypes
	for key := range *parsedCSP {
		// Check if the key is a valid DirectiveType
		if !isValidDirectiveType(key) {
			return nil, fmt.Errorf("invalid CSP directive: %v", key)
		}
	}

	return parsedCSP, nil
}

// Helper function to validate DirectiveTypes
func isValidDirectiveType(d consolev1.DirectiveType) bool {
	validTypes := []consolev1.DirectiveType{
		consolev1.DefaultSrc,
		consolev1.ScriptSrc,
		consolev1.StyleSrc,
		consolev1.ImgSrc,
		consolev1.FontSrc,
	}

	for _, validType := range validTypes {
		if d == validType {
			return true
		}
	}
	return false
}
