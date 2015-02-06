// Package schema provides access to the Bridge API.
//
// See http://github.com/coreos-inc/bridge
//
// Usage example:
//
//   import "code.google.com/p/google-api-go-client/schema/v1"
//   ...
//   schemaService, err := schema.New(oauthHttpClient)
package schema

import (
	"bytes"
	"code.google.com/p/google-api-go-client/googleapi"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// Always reference these packages, just in case the auto-generated code
// below doesn't.
var _ = bytes.NewBuffer
var _ = strconv.Itoa
var _ = fmt.Sprintf
var _ = json.NewDecoder
var _ = io.Copy
var _ = url.Parse
var _ = googleapi.Version
var _ = errors.New
var _ = strings.Replace

const apiId = "bridge:v1"
const apiName = "schema"
const apiVersion = "v1"
const basePath = "http://localhost:9090/api/bridge/v1/"

func New(client *http.Client) (*Service, error) {
	if client == nil {
		return nil, errors.New("client is nil")
	}
	s := &Service{client: client, BasePath: basePath}
	s.Cluster = NewClusterService(s)
	return s, nil
}

type Service struct {
	client   *http.Client
	BasePath string // API endpoint base URL

	Cluster *ClusterService
}

func NewClusterService(s *Service) *ClusterService {
	rs := &ClusterService{s: s}
	return rs
}

type ClusterService struct {
	s *Service
}

type EtcdMachine struct {
	ClientURL string `json:"clientURL,omitempty"`

	Name string `json:"name,omitempty"`

	PeerURL string `json:"peerURL,omitempty"`

	State string `json:"state,omitempty"`
}

type EtcdState struct {
	ActiveSize int64 `json:"activeSize,omitempty"`

	CheckSuccess bool `json:"checkSuccess,omitempty"`

	CurrentSize int64 `json:"currentSize,omitempty"`

	Machines []*EtcdMachine `json:"machines,omitempty"`
}

type UnitState struct {
	Hash string `json:"hash,omitempty"`

	MachineID string `json:"machineID,omitempty"`

	Name string `json:"name,omitempty"`

	SystemdActiveState string `json:"systemdActiveState,omitempty"`

	SystemdLoadState string `json:"systemdLoadState,omitempty"`

	SystemdSubState string `json:"systemdSubState,omitempty"`
}

type UnitStatePage struct {
	NextPageToken string `json:"nextPageToken,omitempty"`

	States []*UnitState `json:"states,omitempty"`
}

// method id "bridge.cluster.status.etcd":

type ClusterEtcdCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// Etcd: Retrieve etcd machine statuses.
func (r *ClusterService) Etcd() *ClusterEtcdCall {
	c := &ClusterEtcdCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

func (c *ClusterEtcdCall) Do() error {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "cluster/status/etcd")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return err
	}
	return nil
	// {
	//   "description": "Retrieve etcd machine statuses.",
	//   "httpMethod": "GET",
	//   "id": "bridge.cluster.status.etcd",
	//   "path": "cluster/status/etcd",
	//   "response": {
	//     "items": {
	//       "$ref": "EtcdMachine"
	//     },
	//     "type": "array"
	//   }
	// }

}

// method id "bridge.cluster.status.units":

type ClusterUnitsCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// Units: Retrieve fleet kubernetes unit statuses.
func (r *ClusterService) Units() *ClusterUnitsCall {
	c := &ClusterUnitsCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

func (c *ClusterUnitsCall) Do() error {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "cluster/status/units")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return err
	}
	return nil
	// {
	//   "description": "Retrieve fleet kubernetes unit statuses.",
	//   "httpMethod": "GET",
	//   "id": "bridge.cluster.status.units",
	//   "path": "cluster/status/units",
	//   "response": {
	//     "items": {
	//       "$ref": "UnitState"
	//     },
	//     "type": "array"
	//   }
	// }

}
