package stripprefix

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/openshift/console/pkg/hypercloud/config"
	"github.com/stretchr/testify/require"
	"gotest.tools/assert"
)

func TestStripPrefix(t *testing.T) {
	testCases := []struct {
		desc               string
		config             config.StripPrefix
		path               string
		expectedStatusCode int
		expectedPath       string
		expectedRawPath    string
		expectedHeader     string
	}{
		{
			desc: "path prefix on exactly matching path",
			config: config.StripPrefix{
				Prefixes: []string{"/stat/"},
			},
			path:               "/stat/",
			expectedStatusCode: http.StatusOK,
			expectedPath:       "",
			expectedHeader:     "/stat/",
		},
		{
			desc: "path prefix on matching longer path",
			config: config.StripPrefix{
				Prefixes: []string{"/stat/"},
			},
			path:               "/stat/us",
			expectedStatusCode: http.StatusOK,
			expectedPath:       "/us",
			expectedHeader:     "/stat/",
		},
	}

	for _, test := range testCases {
		test := test
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			var actualPath, actualRawPath, actualHeader, requestURI string
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				actualPath = r.URL.Path
				actualRawPath = r.URL.RawPath
				actualHeader = r.Header.Get(ForwardedPrefixHeader)
				requestURI = r.RequestURI
			})

			handler, err := New(context.Background(), next, test.config, "foo-strip-prefix")
			require.NoError(t, err)

			req, err := http.NewRequest(http.MethodGet, "http://localhost"+test.path, nil)
			if err != nil {
				fmt.Println("failt to failed to create HTTP request")
			}

			req.RequestURI = req.URL.RequestURI()

			resp := &httptest.ResponseRecorder{Code: http.StatusOK}

			handler.ServeHTTP(resp, req)

			assert.Equal(t, test.expectedStatusCode, resp.Code, "Unexpected status code.")
			assert.Equal(t, test.expectedPath, actualPath, "Unexpected path.")
			assert.Equal(t, test.expectedRawPath, actualRawPath, "Unexpected raw path.")
			assert.Equal(t, test.expectedHeader, actualHeader, "Unexpected '%s' header.", ForwardedPrefixHeader)

			expectedRequestURI := test.expectedPath
			if test.expectedRawPath != "" {
				// go HTTP uses the raw path when existent in the RequestURI
				expectedRequestURI = test.expectedRawPath
			}
			if test.expectedPath == "" {
				expectedRequestURI = "/"
			}
			assert.Equal(t, expectedRequestURI, requestURI, "Unexpected request URI.")
		})
	}
}
