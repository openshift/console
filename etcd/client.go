package etcd

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/coreos-inc/bridge/schema"
)

const Version = "v2"

type Client struct {
	endpoints []url.URL
	hc        http.Client
}

func NewClient(endpoints string) (*Client, error) {
	eps := strings.Split(endpoints, ",")

	if len(eps) == 0 {
		return nil, errors.New("no etcd endpoints supplied")
	}

	parsed := make([]url.URL, len(eps))
	for i, ep := range eps {
		u, err := url.Parse(ep)
		if err != nil {
			return nil, err
		}
		u.Path = fmt.Sprintf("/%s", Version)
		parsed[i] = *u
	}

	return &Client{
		endpoints: parsed,
	}, nil
}

// Given a path return a slice of url strings with base endpoints prefixed.
func (c Client) Urls(urlPath string) []string {
	urls := make([]string, len(c.endpoints))
	for i, u := range c.endpoints {
		urls[i] = fmt.Sprintf("%s/%s", u.String(), path.Clean(urlPath))
	}
	return urls
}

func (c Client) Machines() ([]*schema.EtcdMachine, error) {
	// TODO: cycle thru all endpoints on failure
	resp, err := c.hc.Get(c.Urls("admin/machines")[0])
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error listing etcd machines")
	}

	var machines []*schema.EtcdMachine
	if err = json.NewDecoder(resp.Body).Decode(&machines); err != nil {
		return nil, err
	}

	return machines, nil
}

func (c Client) ActiveSize() (int, error) {
	// TODO: cycle thru all endpoints on failure
	resp, err := c.hc.Get(c.Urls("admin/config")[0])
	if err != nil {
		return -1, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return -1, errors.New("error getting etcd config")
	}

	var cnf map[string]interface{}
	if err = json.NewDecoder(resp.Body).Decode(&cnf); err != nil {
		return -1, err
	}

	val, exists := cnf["activeSize"]
	if exists {
		return int(val.(float64)), nil
	} else {
		return -1, errors.New("missing activeSize key from response")
	}
}
