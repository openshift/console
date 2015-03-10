package server

import (
	"errors"
	"log"
	"net/http"
	"path"
	"sync"

	"github.com/coreos-inc/bridge/etcd"
	"github.com/coreos-inc/bridge/fleet"
	"github.com/coreos-inc/bridge/schema"
)

// serves as a whitelist when filtering units states.
var kubernetesServices = map[string]*bool{
	"kubernetes-apiserver.service":          nil,
	"kubernetes-kubelet.service":            nil,
	"kubernetes-controller-manager.service": nil,
	"kubernetes-proxy.service":              nil,
	"kubernetes-scheduler.service":          nil,
}

type ClusterService struct {
	fleetClient *fleet.Client
	etcdClient  *etcd.Client
}

func NewClusterService(prefix string, mux *http.ServeMux, etcdClient *etcd.Client, fleetClient *fleet.Client) (*ClusterService, error) {
	s := &ClusterService{
		fleetClient: fleetClient,
		etcdClient:  etcdClient,
	}
	mux.HandleFunc(path.Join(prefix, "/cluster/status/units"), s.GetUnits)
	mux.HandleFunc(path.Join(prefix, "/cluster/status/etcd"), s.GetEtcdState)
	return s, nil
}

func (s *ClusterService) GetUnits(w http.ResponseWriter, r *http.Request) {
	unitStates, err := s.fleetClient.UnitStates()
	if err != nil {
		msg := "Error listing fleet units"
		log.Printf("%s, error=%s", msg, err)
		sendError(w, http.StatusInternalServerError, errors.New(msg))
		return
	}

	var filteredUnitStates []*schema.UnitState
	for _, u := range unitStates {
		_, exists := kubernetesServices[u.Name]
		if exists {
			filteredUnitStates = append(filteredUnitStates, u)
		}
	}
	sendResponse(w, http.StatusOK, filteredUnitStates)
}

func (s *ClusterService) GetEtcdState(w http.ResponseWriter, r *http.Request) {
	var wg sync.WaitGroup
	etcdState := schema.EtcdState{
		CheckSuccess: true,
	}

	wg.Add(1)
	go func() {
		machines, err := s.etcdClient.Machines()
		if err != nil {
			msg := "Error listing etcd machines"
			log.Printf("%s - error=%s", msg, err)
			etcdState.CheckSuccess = false
		} else {
			etcdState.Machines = machines
			etcdState.CurrentSize = int64(len(machines))
		}
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		activeSize, err := s.etcdClient.ActiveSize()
		if err != nil {
			msg := "Error getting etcd active size"
			log.Printf("%s - error=%s", msg, err)
			etcdState.CheckSuccess = false
		} else {
			etcdState.ActiveSize = int64(activeSize)
		}
		wg.Done()
	}()

	wg.Wait()
	sendResponse(w, http.StatusOK, etcdState)
}
