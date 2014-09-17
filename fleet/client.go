package fleet

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"

	"github.com/coreos-inc/bridge/schema"
)

const Version = "v1-alpha"

type Client struct {
	endpoint string
	hc       http.Client
}

func NewClient(endpoint string) (*Client, error) {
	dialFunc := net.Dial
	if endpoint == "" {
		endpoint = "http://domain-sock/"
	} else {
		u, err := url.Parse(endpoint)
		if err != nil {
			return nil, err
		}
		if u.Scheme == "unix" {
			endpoint = "http://domain-sock/"
			dialFunc = func(n, addr string) (net.Conn, error) {
				return net.Dial("unix", "/var/run/fleet.sock")
			}
		}
	}

	trans := http.Transport{
		Dial: dialFunc,
	}
	hc := http.Client{
		Transport: &trans,
	}
	return &Client{
		endpoint: endpoint,
		hc:       hc,
	}, nil
}

func (c Client) UnitStates() ([]*schema.UnitState, error) {
	resp, err := c.hc.Get(fmt.Sprintf("%s/%s/%s", c.endpoint, Version, "state"))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var unitStates schema.UnitStatePage
	if err := json.NewDecoder(resp.Body).Decode(&unitStates); err != nil {
		return nil, err
	}

	return unitStates.States, nil
}
