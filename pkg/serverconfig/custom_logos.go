package serverconfig

import (
	"encoding/json"
	"fmt"
	"net/http"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

type CustomLogoFile struct {
	// CustomLogoFile defines the theme and the path of a custom logo.
	// Example: {"theme": "dark-theme", path: "/foo/logo.png"}.
	Theme CustomLogoTheme `json:"theme,omitempty" yaml:"theme,omitempty"`
	Path  string          `json:"path,omitempty" yaml:"path,omitempty"`
}

type CustomLogoFiles struct {
	// CustomLogoFiles defines a list of logo files of certain type.
	// Example: {"type": "masthead", logos: [{"theme": "dark-theme", path: "/foo/logo.png"}]}.
	Type  CustomLogoType   `json:"type,omitempty" yaml:"type,omitempty"`
	Logos []CustomLogoFile `json:"logos,omitempty" yaml:"logos,omitempty"`
}

// CustomLogoType defines the type of the logo, currently either "Masthead" or "Favicon".
type CustomLogoType string

const (
	MastheadType CustomLogoType = "masthead"
	FaviconType  CustomLogoType = "favicon"
)

// CustomLogoTheme defines the theme of the logo, currently either "Dark" or "Light".
type CustomLogoTheme string

const (
	DarkTheme  CustomLogoTheme = "dark-theme"
	LightTheme CustomLogoTheme = "light-theme"
)

func ParseCustomLogoType(s string) (c CustomLogoType, err error) {
	types := map[CustomLogoType]struct{}{
		MastheadType: {},
		FaviconType:  {},
	}

	clt := CustomLogoType(s)
	_, ok := types[clt]
	if !ok {
		return c, fmt.Errorf("unknown custom logo type: \"%s\". Must be one of [masthead, favicon]", s)
	}
	return clt, nil
}

func (t *CustomLogoType) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	switch s {
	case "masthead":
		*t = MastheadType
	case "favicon":
		*t = FaviconType
	default:
		return fmt.Errorf("unknown custom logo type: \"%s\". Must be one of [masthead, favicon]", s)
	}
	return nil
}

func (a *CustomLogoType) Set(value string) error {
	switch value {
	case "masthead":
		*a = MastheadType
	case "favicon":
		*a = FaviconType
	case "":
	default:
		return fmt.Errorf("unknown custom logo type: \"%s\". Must be one of [masthead, favicon]", value)
	}
	return nil
}

func ParseCustomLogoTheme(s string) (c CustomLogoTheme, err error) {
	themes := map[CustomLogoTheme]struct{}{
		DarkTheme:  {},
		LightTheme: {},
	}

	clt := CustomLogoTheme(s)
	_, ok := themes[clt]
	if !ok {
		return c, fmt.Errorf("unknown custom logo theme: \"%s\". Must be one of [dark-theme, light-theme]", s)
	}
	return clt, nil
}

func (t *CustomLogoTheme) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	switch s {
	case "light-theme":
		*t = LightTheme
	case "dark-theme":
		*t = DarkTheme
	default:
		return fmt.Errorf("unknown custom logo theme: \"%s\". Must be one of [dark-theme, light-theme]", s)
	}
	return nil
}

func CustomLogosHandler(w http.ResponseWriter, r *http.Request, logoFiles []CustomLogoFiles) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}
	query := r.URL.Query()
	queryTypeString := query.Get("type")
	queryThemeString := query.Get("theme")
	if queryTypeString == "" || queryThemeString == "" {
		errMsg := fmt.Sprintf("GET request \"%q\" is missing 'theme' or 'type' query parameter", r.URL.String())
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	queryTheme, err := ParseCustomLogoTheme(queryThemeString)
	if err != nil {
		errMsg := fmt.Sprintf("failed to process URL query parameter 'theme': %s", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	queryType, err := ParseCustomLogoType(queryTypeString)
	if err != nil {
		errMsg := fmt.Sprintf("failed to process URL query parameter 'query': %s", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	// logo is a public content, revalidate each new request before releasing cached files
	w.Header().Set("Cache-Control", "public, no-cache")
	// Filter the logos based on the specific type and theme
	for _, logos := range logoFiles {
		if logos.Type == queryType {
			for _, logo := range logos.Logos {
				if logo.Theme == queryTheme {
					http.ServeFile(w, r, logo.Path)
				}
			}
		}
	}
}
