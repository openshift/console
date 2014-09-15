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
	"github.com/coreos-inc/bridge/Godeps/_workspace/src/code.google.com/p/google-api-go-client/googleapi"
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
	s.Minions = NewMinionsService(s)
	s.Pods = NewPodsService(s)
	s.ReplicationControllers = NewReplicationControllersService(s)
	s.Services = NewServicesService(s)
	s.Users = NewUsersService(s)
	return s, nil
}

type Service struct {
	client   *http.Client
	BasePath string // API endpoint base URL

	Minions *MinionsService

	Pods *PodsService

	ReplicationControllers *ReplicationControllersService

	Services *ServicesService

	Users *UsersService
}

func NewMinionsService(s *Service) *MinionsService {
	rs := &MinionsService{s: s}
	return rs
}

type MinionsService struct {
	s *Service
}

func NewPodsService(s *Service) *PodsService {
	rs := &PodsService{s: s}
	return rs
}

type PodsService struct {
	s *Service
}

func NewReplicationControllersService(s *Service) *ReplicationControllersService {
	rs := &ReplicationControllersService{s: s}
	return rs
}

type ReplicationControllersService struct {
	s *Service
}

func NewServicesService(s *Service) *ServicesService {
	rs := &ServicesService{s: s}
	return rs
}

type ServicesService struct {
	s *Service
}

func NewUsersService(s *Service) *UsersService {
	rs := &UsersService{s: s}
	return rs
}

type UsersService struct {
	s *Service
}

type Minion struct {
	Id string `json:"id,omitempty"`

	Kind string `json:"kind,omitempty"`
}

type MinionList struct {
	Minions []*Minion `json:"minions,omitempty"`
}

type Pod struct {
	CreationTimestamp string `json:"creationTimestamp,omitempty"`

	// CurrentState: The current configuration and status of the pod. Fields
	// in common with desiredState have the same meaning.
	CurrentState *PodCurrentState `json:"currentState,omitempty"`

	// DesiredState: The desired configuration of the pod
	DesiredState *PodDesiredState `json:"desiredState,omitempty"`

	Id string `json:"id,omitempty"`

	Kind string `json:"kind,omitempty"`

	Labels *PodLabels `json:"labels,omitempty"`

	SelfLink string `json:"selfLink,omitempty"`
}

type PodCurrentState struct {
	Host string `json:"host,omitempty"`

	HostIP string `json:"hostIP,omitempty"`

	Info *PodCurrentStateInfo `json:"info,omitempty"`

	Manifest *PodCurrentStateManifest `json:"manifest,omitempty"`

	Status string `json:"status,omitempty"`
}

type PodCurrentStateInfo struct {
}

type PodCurrentStateManifest struct {
}

type PodDesiredState struct {
	Host string `json:"host,omitempty"`

	HostIP string `json:"hostIP,omitempty"`

	Info *PodDesiredStateInfo `json:"info,omitempty"`

	// Manifest: Manifest describing group of [Docker
	// containers](http://docker.io); compatible with format used by [Google
	// Cloud Platform's container-vm
	// images](https://developers.google.com/compute/docs/containers)
	Manifest *PodDesiredStateManifest `json:"manifest,omitempty"`

	Status string `json:"status,omitempty"`
}

type PodDesiredStateInfo struct {
}

type PodDesiredStateManifest struct {
}

type PodLabels struct {
}

type PodList struct {
	Items []*Pod `json:"items,omitempty"`
}

type ReplicationController struct {
	CreationTimestamp string `json:"creationTimestamp,omitempty"`

	// DesiredState: The desired configuration of the replicationController
	DesiredState *ReplicationControllerDesiredState `json:"desiredState,omitempty"`

	Id string `json:"id,omitempty"`

	Kind string `json:"kind,omitempty"`

	Labels *ReplicationControllerLabels `json:"labels,omitempty"`

	SelfLink string `json:"selfLink,omitempty"`
}

type ReplicationControllerDesiredState struct {
	// PodTemplate: Template from which to create new pods, as necessary.
	// Identical to pod schema.
	PodTemplate *ReplicationControllerDesiredStatePodTemplate `json:"podTemplate,omitempty"`

	// ReplicaSelector: Required labels used to identify pods in the set
	ReplicaSelector *ReplicationControllerDesiredStateReplicaSelector `json:"replicaSelector,omitempty"`

	// Replicas: Number of pods desired in the set
	Replicas float64 `json:"replicas,omitempty"`
}

type ReplicationControllerDesiredStatePodTemplate struct {
}

type ReplicationControllerDesiredStateReplicaSelector struct {
}

type ReplicationControllerLabels struct {
}

type ReplicationControllerList struct {
	Items []*ReplicationController `json:"items,omitempty"`
}

type Service1 struct {
	CreationTimestamp string `json:"creationTimestamp,omitempty"`

	Id string `json:"id,omitempty"`

	Kind string `json:"kind,omitempty"`

	Labels *ServiceLabels `json:"labels,omitempty"`

	Name string `json:"name,omitempty"`

	Port float64 `json:"port,omitempty"`

	Selector *ServiceSelector `json:"selector,omitempty"`

	SelfLink string `json:"selfLink,omitempty"`
}

type ServiceLabels struct {
}

type ServiceSelector struct {
}

type ServiceList struct {
	Items []*Service1 `json:"items,omitempty"`
}

type Status struct {
	ApiVersion string `json:"apiVersion,omitempty"`

	CreationTimestamp string `json:"creationTimestamp,omitempty"`

	Details *StatusDetails `json:"details,omitempty"`

	Kind string `json:"kind,omitempty"`

	Reason string `json:"reason,omitempty"`

	Status string `json:"status,omitempty"`
}

type StatusDetails struct {
}

type User struct {
	FirstName string `json:"firstName,omitempty"`

	Id string `json:"id,omitempty"`

	LastName string `json:"lastName,omitempty"`
}

type UserPage struct {
	NextPageToken string `json:"nextPageToken,omitempty"`

	Users []*User `json:"users,omitempty"`
}

// method id "bridge.minions.get":

type MinionsGetCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Get: Retrieve a Minion.
func (r *MinionsService) Get(id string) *MinionsGetCall {
	c := &MinionsGetCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *MinionsGetCall) Id(id string) *MinionsGetCall {
	c.opt_["id"] = id
	return c
}

func (c *MinionsGetCall) Do() (*Minion, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "minions/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Minion)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a Minion.",
	//   "httpMethod": "GET",
	//   "id": "bridge.minions.get",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "minions/{id}",
	//   "response": {
	//     "$ref": "Minion"
	//   }
	// }

}

// method id "bridge.minions.list":

type MinionsListCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// List: Retrieve a list of Minions.
func (r *MinionsService) List() *MinionsListCall {
	c := &MinionsListCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

func (c *MinionsListCall) Do() (*MinionList, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "minions")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(MinionList)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a list of Minions.",
	//   "httpMethod": "GET",
	//   "id": "bridge.minions.list",
	//   "path": "minions",
	//   "response": {
	//     "$ref": "MinionList"
	//   }
	// }

}

// method id "bridge.pods.create":

type PodsCreateCall struct {
	s    *Service
	pod  *Pod
	opt_ map[string]interface{}
}

// Create: Create a new Pod.
func (r *PodsService) Create(pod *Pod) *PodsCreateCall {
	c := &PodsCreateCall{s: r.s, opt_: make(map[string]interface{})}
	c.pod = pod
	return c
}

func (c *PodsCreateCall) Do() (*Pod, error) {
	var body io.Reader = nil
	body, err := googleapi.WithoutDataWrapper.JSONReader(c.pod)
	if err != nil {
		return nil, err
	}
	ctype := "application/json"
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "pods")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("POST", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("Content-Type", ctype)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Pod)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Create a new Pod.",
	//   "httpMethod": "POST",
	//   "id": "bridge.pods.create",
	//   "path": "pods",
	//   "request": {
	//     "$ref": "Pod"
	//   },
	//   "response": {
	//     "$ref": "Pod"
	//   }
	// }

}

// method id "bridge.pods.delete":

type PodsDeleteCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Delete: Delete a Pod.
func (r *PodsService) Delete(id string) *PodsDeleteCall {
	c := &PodsDeleteCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *PodsDeleteCall) Id(id string) *PodsDeleteCall {
	c.opt_["id"] = id
	return c
}

func (c *PodsDeleteCall) Do() (*Status, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "pods/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("DELETE", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Status)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Delete a Pod.",
	//   "httpMethod": "DELETE",
	//   "id": "bridge.pods.delete",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "pods/{id}",
	//   "response": {
	//     "$ref": "Status"
	//   }
	// }

}

// method id "bridge.pods.get":

type PodsGetCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Get: Retrieve a Pod.
func (r *PodsService) Get(id string) *PodsGetCall {
	c := &PodsGetCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *PodsGetCall) Id(id string) *PodsGetCall {
	c.opt_["id"] = id
	return c
}

func (c *PodsGetCall) Do() (*Pod, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "pods/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Pod)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a Pod.",
	//   "httpMethod": "GET",
	//   "id": "bridge.pods.get",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "pods/{id}",
	//   "response": {
	//     "$ref": "Pod"
	//   }
	// }

}

// method id "bridge.pods.list":

type PodsListCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// List: Retrieve a list of Pods.
func (r *PodsService) List() *PodsListCall {
	c := &PodsListCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

// Labels sets the optional parameter "labels":
func (c *PodsListCall) Labels(labels string) *PodsListCall {
	c.opt_["labels"] = labels
	return c
}

func (c *PodsListCall) Do() (*PodList, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["labels"]; ok {
		params.Set("labels", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "pods")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(PodList)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a list of Pods.",
	//   "httpMethod": "GET",
	//   "id": "bridge.pods.list",
	//   "parameters": {
	//     "labels": {
	//       "location": "query",
	//       "required": false,
	//       "type": "string"
	//     }
	//   },
	//   "path": "pods",
	//   "response": {
	//     "$ref": "PodList"
	//   }
	// }

}

// method id "bridge.replicationControllers.create":

type ReplicationControllersCreateCall struct {
	s                     *Service
	replicationcontroller *ReplicationController
	opt_                  map[string]interface{}
}

// Create: Create a new repliactoinController.
func (r *ReplicationControllersService) Create(replicationcontroller *ReplicationController) *ReplicationControllersCreateCall {
	c := &ReplicationControllersCreateCall{s: r.s, opt_: make(map[string]interface{})}
	c.replicationcontroller = replicationcontroller
	return c
}

func (c *ReplicationControllersCreateCall) Do() (*ReplicationController, error) {
	var body io.Reader = nil
	body, err := googleapi.WithoutDataWrapper.JSONReader(c.replicationcontroller)
	if err != nil {
		return nil, err
	}
	ctype := "application/json"
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "replicationControllers")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("POST", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("Content-Type", ctype)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(ReplicationController)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Create a new repliactoinController.",
	//   "httpMethod": "POST",
	//   "id": "bridge.replicationControllers.create",
	//   "path": "replicationControllers",
	//   "request": {
	//     "$ref": "ReplicationController"
	//   },
	//   "response": {
	//     "$ref": "ReplicationController"
	//   }
	// }

}

// method id "bridge.replicationControllers.delete":

type ReplicationControllersDeleteCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Delete: Delete a replicationController.
func (r *ReplicationControllersService) Delete(id string) *ReplicationControllersDeleteCall {
	c := &ReplicationControllersDeleteCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *ReplicationControllersDeleteCall) Id(id string) *ReplicationControllersDeleteCall {
	c.opt_["id"] = id
	return c
}

func (c *ReplicationControllersDeleteCall) Do() (*Status, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "replicatoinControllers/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("DELETE", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Status)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Delete a replicationController.",
	//   "httpMethod": "DELETE",
	//   "id": "bridge.replicationControllers.delete",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "replicatoinControllers/{id}",
	//   "response": {
	//     "$ref": "Status"
	//   }
	// }

}

// method id "bridge.replicationControllers.get":

type ReplicationControllersGetCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Get: Retrieve a replicationControllers.
func (r *ReplicationControllersService) Get(id string) *ReplicationControllersGetCall {
	c := &ReplicationControllersGetCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *ReplicationControllersGetCall) Id(id string) *ReplicationControllersGetCall {
	c.opt_["id"] = id
	return c
}

// Labels sets the optional parameter "labels":
func (c *ReplicationControllersGetCall) Labels(labels string) *ReplicationControllersGetCall {
	c.opt_["labels"] = labels
	return c
}

func (c *ReplicationControllersGetCall) Do() (*ReplicationController, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	if v, ok := c.opt_["labels"]; ok {
		params.Set("labels", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "replicationControllers/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(ReplicationController)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a replicationControllers.",
	//   "httpMethod": "GET",
	//   "id": "bridge.replicationControllers.get",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     },
	//     "labels": {
	//       "location": "query",
	//       "required": false,
	//       "type": "string"
	//     }
	//   },
	//   "path": "replicationControllers/{id}",
	//   "response": {
	//     "$ref": "ReplicationController"
	//   }
	// }

}

// method id "bridge.replicationControllers.list":

type ReplicationControllersListCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// List: Retrieve a list of replicationControllers.
func (r *ReplicationControllersService) List() *ReplicationControllersListCall {
	c := &ReplicationControllersListCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

func (c *ReplicationControllersListCall) Do() (*ReplicationControllerList, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "replicationControllers")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(ReplicationControllerList)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a list of replicationControllers.",
	//   "httpMethod": "GET",
	//   "id": "bridge.replicationControllers.list",
	//   "path": "replicationControllers",
	//   "response": {
	//     "$ref": "ReplicationControllerList"
	//   }
	// }

}

// method id "bridge.services.create":

type ServicesCreateCall struct {
	s       *Service
	service *Service
	opt_    map[string]interface{}
}

// Create: Create a new Service.
func (r *ServicesService) Create(service *Service) *ServicesCreateCall {
	c := &ServicesCreateCall{s: r.s, opt_: make(map[string]interface{})}
	c.service = service
	return c
}

func (c *ServicesCreateCall) Do() (*Service1, error) {
	var body io.Reader = nil
	body, err := googleapi.WithoutDataWrapper.JSONReader(c.service)
	if err != nil {
		return nil, err
	}
	ctype := "application/json"
	params := make(url.Values)
	params.Set("alt", "json")
	urls := googleapi.ResolveRelative(c.s.BasePath, "services")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("POST", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("Content-Type", ctype)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Service1)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Create a new Service.",
	//   "httpMethod": "POST",
	//   "id": "bridge.services.create",
	//   "path": "services",
	//   "request": {
	//     "$ref": "Service"
	//   },
	//   "response": {
	//     "$ref": "Service"
	//   }
	// }

}

// method id "bridge.services.delete":

type ServicesDeleteCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Delete: Delete a Service.
func (r *ServicesService) Delete(id string) *ServicesDeleteCall {
	c := &ServicesDeleteCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *ServicesDeleteCall) Id(id string) *ServicesDeleteCall {
	c.opt_["id"] = id
	return c
}

func (c *ServicesDeleteCall) Do() (*Status, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "services/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("DELETE", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Status)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Delete a Service.",
	//   "httpMethod": "DELETE",
	//   "id": "bridge.services.delete",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "services/{id}",
	//   "response": {
	//     "$ref": "Status"
	//   }
	// }

}

// method id "bridge.services.get":

type ServicesGetCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Get: Retrieve a Service.
func (r *ServicesService) Get(id string) *ServicesGetCall {
	c := &ServicesGetCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *ServicesGetCall) Id(id string) *ServicesGetCall {
	c.opt_["id"] = id
	return c
}

func (c *ServicesGetCall) Do() (*Service1, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "services/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(Service1)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a Service.",
	//   "httpMethod": "GET",
	//   "id": "bridge.services.get",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "services/{id}",
	//   "response": {
	//     "$ref": "Service"
	//   }
	// }

}

// method id "bridge.services.list":

type ServicesListCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// List: Retrieve a list of Services.
func (r *ServicesService) List() *ServicesListCall {
	c := &ServicesListCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

// Labels sets the optional parameter "labels":
func (c *ServicesListCall) Labels(labels string) *ServicesListCall {
	c.opt_["labels"] = labels
	return c
}

func (c *ServicesListCall) Do() (*ServiceList, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["labels"]; ok {
		params.Set("labels", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "services")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(ServiceList)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a list of Services.",
	//   "httpMethod": "GET",
	//   "id": "bridge.services.list",
	//   "parameters": {
	//     "labels": {
	//       "location": "query",
	//       "required": false,
	//       "type": "string"
	//     }
	//   },
	//   "path": "services",
	//   "response": {
	//     "$ref": "ServiceList"
	//   }
	// }

}

// method id "bridge.user.destroy":

type UsersDestroyCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Destroy: Destroy a User.
func (r *UsersService) Destroy(id string) *UsersDestroyCall {
	c := &UsersDestroyCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *UsersDestroyCall) Id(id string) *UsersDestroyCall {
	c.opt_["id"] = id
	return c
}

func (c *UsersDestroyCall) Do() error {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "users/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("DELETE", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
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
	//   "description": "Destroy a User.",
	//   "httpMethod": "DELETE",
	//   "id": "bridge.user.destroy",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "users/{id}"
	// }

}

// method id "bridge.users.get":

type UsersGetCall struct {
	s    *Service
	id   string
	opt_ map[string]interface{}
}

// Get: Retrieve a User.
func (r *UsersService) Get(id string) *UsersGetCall {
	c := &UsersGetCall{s: r.s, opt_: make(map[string]interface{})}
	c.id = id
	return c
}

// Id sets the optional parameter "id":
func (c *UsersGetCall) Id(id string) *UsersGetCall {
	c.opt_["id"] = id
	return c
}

func (c *UsersGetCall) Do() (*User, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["id"]; ok {
		params.Set("id", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "users/{id}")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	req.URL.Path = strings.Replace(req.URL.Path, "{id}", url.QueryEscape(c.id), 1)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(User)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a User.",
	//   "httpMethod": "GET",
	//   "id": "bridge.users.get",
	//   "parameterOrder": [
	//     "id"
	//   ],
	//   "parameters": {
	//     "id": {
	//       "location": "path",
	//       "type": "string"
	//     }
	//   },
	//   "path": "users/{id}",
	//   "response": {
	//     "$ref": "User"
	//   }
	// }

}

// method id "bridge.users.list":

type UsersListCall struct {
	s    *Service
	opt_ map[string]interface{}
}

// List: Retrieve a page of Users.
func (r *UsersService) List() *UsersListCall {
	c := &UsersListCall{s: r.s, opt_: make(map[string]interface{})}
	return c
}

// NextPageToken sets the optional parameter "nextPageToken":
func (c *UsersListCall) NextPageToken(nextPageToken string) *UsersListCall {
	c.opt_["nextPageToken"] = nextPageToken
	return c
}

func (c *UsersListCall) Do() (*UserPage, error) {
	var body io.Reader = nil
	params := make(url.Values)
	params.Set("alt", "json")
	if v, ok := c.opt_["nextPageToken"]; ok {
		params.Set("nextPageToken", fmt.Sprintf("%v", v))
	}
	urls := googleapi.ResolveRelative(c.s.BasePath, "users")
	urls += "?" + params.Encode()
	req, _ := http.NewRequest("GET", urls, body)
	googleapi.SetOpaque(req.URL)
	req.Header.Set("User-Agent", "google-api-go-client/0.5")
	res, err := c.s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer googleapi.CloseBody(res)
	if err := googleapi.CheckResponse(res); err != nil {
		return nil, err
	}
	ret := new(UserPage)
	if err := json.NewDecoder(res.Body).Decode(ret); err != nil {
		return nil, err
	}
	return ret, nil
	// {
	//   "description": "Retrieve a page of Users.",
	//   "httpMethod": "GET",
	//   "id": "bridge.users.list",
	//   "parameters": {
	//     "nextPageToken": {
	//       "location": "query",
	//       "type": "string"
	//     }
	//   },
	//   "path": "users",
	//   "response": {
	//     "$ref": "UserPage"
	//   }
	// }

}
