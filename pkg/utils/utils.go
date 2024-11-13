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
	// The default sources are the sources that are allowed for all directives.
	// When running on-cluster, the default sources are just 'self' (i.e. the same origin).
	// When running off-cluster, the default sources are 'self' and 'http://localhost:8080' and 'ws://localhost:8080'
	// (i.e. the same origin and the proxy endpoint).
	defaultSources := "'self'"
	if k8sMode == "off-cluster" {
		defaultSources += " http://localhost:8080 ws://localhost:8080"
	}

	// The newCSPDirectives map is used to store the directives for each type.
	// The keys are the types of directives (e.g. DefaultSrc, ImgSrc, etc) and the values are the sources for each type.
	// The sources are strings that are concatenated together with a space separator.
	newCSPDirectives := map[consolev1.DirectiveType][]string{
		consolev1.DefaultSrc: {defaultSources},
		consolev1.ImgSrc:     {defaultSources},
		consolev1.FontSrc:    {defaultSources},
		consolev1.ScriptSrc:  {defaultSources},
		consolev1.StyleSrc:   {defaultSources},
	}

	// If the plugins are providing a content security policy configuration, parse it and add it to the directives map.
	// The configuration is a string that is parsed into a map of directive types to sources.
	// The sources are added to the existing sources for each type.
	if pluginsCSP != "" {
		var err error
		parsedCSP, err := ParseContentSecurityPolicyConfig(pluginsCSP)
		if err != nil {
			return nil, err
		}
		for cspType, csp := range *parsedCSP {
			newCSPDirectives[cspType] = append(newCSPDirectives[cspType], csp...)
		}
	}

	// Construct the CSP directives string from the newCSPDirectives map.
	// The string is a space-separated list of directives, where each directive is a string
	// of the form "<directive-type> <sources>".
	// The sources are concatenated together with a space separator.
	// The CSP directives string is returned as a slice of strings, where each string is a directive.
	cspDirectives := []string{
		fmt.Sprintf("base-uri %s", defaultSources),
		fmt.Sprintf("default-src %s", strings.Join(newCSPDirectives[consolev1.DefaultSrc], " ")),
		fmt.Sprintf("img-src %s data:", strings.Join(newCSPDirectives[consolev1.ImgSrc], " ")),
		fmt.Sprintf("font-src %s data:", strings.Join(newCSPDirectives[consolev1.FontSrc], " ")),
		fmt.Sprintf("script-src %s 'unsafe-eval' 'nonce-%s'", strings.Join(newCSPDirectives[consolev1.ScriptSrc], " "), indexPageScriptNonce),
		fmt.Sprintf("style-src %s 'unsafe-inline'", strings.Join(newCSPDirectives[consolev1.StyleSrc], " ")),
		"frame-src 'none'",
		"frame-ancestors 'none'",
		"object-src 'none'",
	}

	return cspDirectives, nil
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
