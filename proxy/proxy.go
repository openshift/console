package proxy

import (
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"path"
	"strings"
)

type Proxy interface {
	Do(*http.Request) (http.Response, error)
	DoAndRespond(http.ResponseWriter, *http.Request) error
}

// Base proxy functionality.
type baseProxy struct {
	HttpClient              *http.Client
	RemoteUrl               *url.URL
	LocalPrefix             string
	RequestHeaderBlacklist  []string
	ResponseHeaderBlacklist []string
}

// Proxy a local request to a remote endpoint
func (p *baseProxy) Do(localReq *http.Request) (*http.Response, error) {
	// Make copy of original local request as base for remote request.
	req := &http.Request{}
	*req = *localReq

	remoteUrl := &url.URL{}
	*remoteUrl = *p.RemoteUrl

	// Remove blacklisted headers.
	for _, h := range p.RequestHeaderBlacklist {
		req.Header.Del(h)
	}

	req.RequestURI = ""
	req.URL = remoteUrl
	req.URL.Path = path.Join(req.URL.Path, strings.Replace(localReq.URL.Path, p.LocalPrefix, "", 1))
	log.Printf("proxy request from=%s%s to=%s", localReq.Host, localReq.URL.String(), req.URL.String())

	resp, err := p.HttpClient.Do(req)
	return resp, err
}

// Same as Do(), but also write the raw response to the ResponseWriter
func (p *baseProxy) DoAndRespond(w http.ResponseWriter, localReq *http.Request) error {
	resp, err := p.Do(localReq)
	if err != nil {
		return err
	}

	// Remove blacklisted headers.
	for _, h := range p.ResponseHeaderBlacklist {
		resp.Header.Del(h)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	w.WriteHeader(resp.StatusCode)
	w.Write(body)
	return nil
}
