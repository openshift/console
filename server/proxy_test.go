package server

import (
	"net/http"
	"net/url"
	"reflect"
	"testing"
)

func TestProxyDirector(t *testing.T) {
	tests := []struct {
		target    url.URL
		blacklist []string
		in        *http.Request
		want      *http.Request
	}{
		{
			target: url.URL{Scheme: "http", Host: "target.com", Path: "/target/base"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}},
			},
		},
		// host with ports
		{
			target: url.URL{Scheme: "http", Host: "target.com:1234", Path: "/target/base"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com:1234",
				URL:    &url.URL{Scheme: "http", Host: "target.com:1234", Path: "/target/base/clients"},
			},
		},
		// use target scheme
		{
			target: url.URL{Scheme: "https", Host: "target.com", Path: "/target/base"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "https", Host: "target.com", Path: "/target/base/clients"},
			},
		},
		// strip blacklisted headers, keeps others
		{
			target:    url.URL{Scheme: "http", Host: "target.com", Path: "/target/base"},
			blacklist: []string{"Cookie", "User-Agent"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}, "Cookie": []string{"choco-chip"}, "User-Agent": []string{"web-browser"}},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}},
			},
		},
		// keep query vars
		{
			target: url.URL{Scheme: "http", Host: "target.com", Path: "/target/base"},
			in: &http.Request{
				Method: "GET",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients", RawQuery: "foo=bar&abc=xyz"},
			},
			want: &http.Request{
				Method: "GET",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients", RawQuery: "foo=bar&abc=xyz"},
			},
		},
	}

	for i, tt := range tests {
		cfg := proxyConfig{
			Target:          tt.target,
			HeaderBlacklist: tt.blacklist,
		}
		p := newProxy(cfg)
		p.Director(tt.in)

		if !reflect.DeepEqual(*tt.want, *tt.in) {
			t.Errorf("case %d: invalid result, \nwant=%v, \ngot=%v", i, *tt.want, *tt.in)
		}
	}
}
