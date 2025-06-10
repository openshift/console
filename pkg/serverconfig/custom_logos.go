package serverconfig

import (
	"fmt"
	"net/http"

	operatorv1 "github.com/openshift/api/operator/v1"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

func ParseCustomLogoTheme(s string) (c operatorv1.ThemeMode, err error) {
	themes := map[operatorv1.ThemeMode]struct{}{
		operatorv1.ThemeModeLight: {},
		operatorv1.ThemeModeDark:  {},
	}

	clt := operatorv1.ThemeMode(s)
	_, ok := themes[clt]
	if !ok {
		return c, fmt.Errorf("unknown custom logo theme: \"%s\". Must be one of [%s, %s]", s, operatorv1.ThemeModeDark, operatorv1.ThemeModeLight)
	}
	return clt, nil
}

func ParseCustomLogoType(s string) (c operatorv1.LogoType, err error) {
	types := map[operatorv1.LogoType]struct{}{
		operatorv1.LogoTypeMasthead: {},
		operatorv1.LogoTypeFavicon:  {},
	}

	clt := operatorv1.LogoType(s)
	_, ok := types[clt]
	if !ok {
		return c, fmt.Errorf("unknown custom logo type: \"%s\". Must be one of [masthead, favicon]", s)
	}
	return clt, nil
}

func CustomLogosHandler(w http.ResponseWriter, r *http.Request, mastheadFiles LogosKeyValue, faviconFiles LogosKeyValue) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}
	query := r.URL.Query()
	queryTypeString := query.Get("type")
	queryThemeString := query.Get("theme")
	if queryTypeString == "" && queryThemeString == "" {
		errMsg := fmt.Sprintf("GET request \"%q\" is missing 'theme' and 'type' query parameter", r.URL.String())
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
		errMsg := fmt.Sprintf("failed to process URL query parameter 'type': %s", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	// logo is a public content, revalidate each new request before releasing cached files
	w.Header().Set("Cache-Control", "no-cache, no-store")

	// Filter the logos based on the specific type and theme
	if queryType == operatorv1.LogoTypeMasthead {
		for theme, file := range mastheadFiles {
			if theme == queryTheme {
				http.ServeFile(w, r, file)
				return
			}
		}
	}
	if queryType == operatorv1.LogoTypeFavicon {
		for theme, file := range faviconFiles {
			if theme == queryTheme {
				http.ServeFile(w, r, file)
				return
			}
		}
	}
	errMsg := fmt.Sprintf("failed to retrieve requested resource with URL query params: (type: %s, theme: %s)", queryType, queryTheme)
	serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: errMsg})
}
