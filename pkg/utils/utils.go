package utils

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"k8s.io/klog/v2"

	consolev1 "github.com/openshift/api/console/v1"

	"github.com/openshift/console/pkg/csp"
)

const (
	// well-known csp directive names
	baseURI        = "base-uri"
	defaultSrc     = "default-src"
	imgSrc         = "img-src"
	fontSrc        = "font-src"
	scriptSrc      = "script-src"
	styleSrc       = "style-src"
	frameSrc       = "frame-src"
	frameAncestors = "frame-ancestors"
	objectSrc      = "object-src"

	// well-known csp directive values
	consoleDot    = "console.redhat.com"
	httpLocalHost = "http://localhost:8080"
	wsLocalHost   = "ws://localhost:8080"
	self          = "'self'"
	data          = "data:"
	unsafeEval    = "'unsafe-eval'"
	unsafeInline  = "'unsafe-inline'"
	none          = "'none'"
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

	baseUriDirective, err := csp.NewDirective(baseURI, self)
	if err != nil {
		return []string{}, err
	}

	// The default sources are the sources that are allowed for all directives.
	// When running on-cluster, the default sources are just 'self' and 'console.redhat.com'.
	// When running off-cluster, 'http://localhost:8080' and 'ws://localhost:8080' are appended to the
	// default sources. Image source, font source, and style source only use 'self' and
	// 'http://localhost:8080'.
	defaultSrcDirective, err := csp.NewDirective(defaultSrc, self, consoleDot)
	if err != nil {
		return []string{}, err
	}

	imgSrcDirective, err := csp.NewDirective(imgSrc, self)
	if err != nil {
		return []string{}, err
	}

	fontSrcDirective, err := csp.NewDirective(fontSrc, self)
	if err != nil {
		return []string{}, err
	}

	scriptSrcDirective, err := csp.NewDirective(scriptSrc, self, consoleDot)
	if err != nil {
		return []string{}, err
	}

	styleSrcDirective, err := csp.NewDirective(styleSrc, self)
	if err != nil {
		return []string{}, err
	}

	if k8sMode == "off-cluster" {
		err = baseUriDirective.AddValues(httpLocalHost, wsLocalHost)
		if err != nil {
			return []string{}, err
		}

		err = defaultSrcDirective.AddValues(httpLocalHost, wsLocalHost)
		if err != nil {
			return []string{}, err
		}

		err = imgSrcDirective.AddValues(httpLocalHost)
		if err != nil {
			return []string{}, err
		}

		err = fontSrcDirective.AddValues(httpLocalHost)
		if err != nil {
			return []string{}, err
		}

		err = scriptSrcDirective.AddValues(httpLocalHost, wsLocalHost)
		if err != nil {
			return []string{}, err
		}

		err = styleSrcDirective.AddValues(httpLocalHost)
		if err != nil {
			return []string{}, err
		}
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
				err = defaultSrcDirective.AddValues(sources...)
				if err != nil {
					return []string{}, err
				}
			case consolev1.ImgSrc:
				err = imgSrcDirective.AddValues(sources...)
				if err != nil {
					return []string{}, err
				}
			case consolev1.FontSrc:
				err = fontSrcDirective.AddValues(sources...)
				if err != nil {
					return []string{}, err
				}
			case consolev1.ScriptSrc:
				err = scriptSrcDirective.AddValues(sources...)
				if err != nil {
					return []string{}, err
				}
			case consolev1.StyleSrc:
				err = styleSrcDirective.AddValues(sources...)
				if err != nil {
					return []string{}, err
				}
			default:
				klog.Warningf("ignored invalid CSP directive: %v", directive)
			}
		}
	}

	err = imgSrcDirective.AddValues(data)
	if err != nil {
		return []string{}, err
	}

	err = fontSrcDirective.AddValues(data)
	if err != nil {
		return []string{}, err
	}

	err = scriptSrcDirective.AddValues(unsafeEval, fmt.Sprintf("'nonce-%s'", indexPageScriptNonce))
	if err != nil {
		return []string{}, err
	}

	err = styleSrcDirective.AddValues(unsafeInline)
	if err != nil {
		return []string{}, err
	}

	frameSrcDirective, err := csp.NewDirective(frameSrc, none)
	if err != nil {
		return []string{}, err
	}

	frameAncestorsDirective, err := csp.NewDirective(frameAncestors, none)
	if err != nil {
		return []string{}, err
	}

	objectSrcDirective, err := csp.NewDirective(objectSrc, none)
	if err != nil {
		return []string{}, err
	}

	// Construct the full list of directives from the aggregated sources.
	// This array is a list of directives, where each directive is a string
	// of the form "<directive-type> <sources>".
	// The sources are concatenated together with a space separator.
	// The CSP directives string is returned as a slice of strings, where each string is a directive.
	return []string{
		baseUriDirective.ToString(),
		defaultSrcDirective.ToString(),
		imgSrcDirective.ToString(),
		fontSrcDirective.ToString(),
		scriptSrcDirective.ToString(),
		styleSrcDirective.ToString(),
		frameSrcDirective.ToString(),
		frameAncestorsDirective.ToString(),
		objectSrcDirective.ToString(),
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
