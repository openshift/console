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

type clusterServiceConfig struct {
	FleetClient *fleet.Client
	EtcdClient  *etcd.Client
	K8sConfig   *K8sConfig
	Prefix      string
	Mux         *http.ServeMux
}

type ClusterService struct {
	fleetClient *fleet.Client
	etcdClient  *etcd.Client
	k8sConfig   *K8sConfig
	// Serves as a whitelist when filtering for control service state.
	controlServices map[string]string
}

func registerClusterService(cfg clusterServiceConfig) {
	svcs := make(map[string]string)
	svcs[cfg.K8sConfig.APIService] = "API Server"
	svcs[cfg.K8sConfig.ControllerManagerService] = "Controller Manager"
	svcs[cfg.K8sConfig.SchedulerService] = "Scheduler"

	s := &ClusterService{
		fleetClient:     cfg.FleetClient,
		etcdClient:      cfg.EtcdClient,
		k8sConfig:       cfg.K8sConfig,
		controlServices: svcs,
	}
	cfg.Mux.HandleFunc(path.Join(cfg.Prefix, "/cluster/status/control-services"), s.GetUnits)
	cfg.Mux.HandleFunc(path.Join(cfg.Prefix, "/cluster/status/etcd"), s.GetEtcdState)
}

func (s *ClusterService) isControlService(name string) (string, bool) {
	id, found := s.controlServices[name]
	return id, found
}

func (s *ClusterService) GetUnits(w http.ResponseWriter, r *http.Request) {
	unitStates, err := s.fleetClient.UnitStates()
	if err != nil {
		msg := "Error listing fleet units"
		log.Printf("%s, error=%s", msg, err)
		sendError(w, http.StatusInternalServerError, errors.New(msg))
		return
	}

	usIdx := make(map[string][]*schema.UnitState)
	for _, u := range unitStates {
		if sid, isCtrl := s.isControlService(u.Name); isCtrl {
			ul, ok := usIdx[sid]
			if ok {
				ul = append(ul, u)
			} else {
				usIdx[sid] = []*schema.UnitState{u}
			}
		}
	}

	results := make([]*schema.ControlService, 0)
	for id, us := range usIdx {
		cs := &schema.ControlService{
			Id:         id,
			UnitStates: us,
		}
		results = append(results, cs)
	}
	sendResponse(w, http.StatusOK, results)
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
