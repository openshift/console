package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"golang.org/x/net/context"

	log "github.com/Sirupsen/logrus"

	"github.com/coreos-inc/tectonic/bootstrap/server/ctxh"
)

// CreateOperation defines a cluster creation request.
type CreateOperation struct {
	// bootcfg gRPC API name/IP and port
	BootcfgRPC string `json:"bootcfgRPC"`
	// Bootcfg certificate authority for verifying the server's identity
	BootcfgCA string `json:"bootcfgCA"`
	// Bootcfg client certificate and key for authentication
	BootcfgClientCert string `json:"bootcfgClientCert"`
	BootcfgClientKey  string `json:"bootcfgClientKey"`

	// Kind of cluster which should be created
	ClusterKind string `json:"clusterKind"`
	// Cluster properties
	ClusterData json.RawMessage `json:"cluster"`
}

// Cluster parses cluster kind and data to return a Cluster.
func (o *CreateOperation) Cluster() (Cluster, error) {
	var cluster Cluster
	switch o.ClusterKind {
	case "bootkube":
		cluster = new(BootkubeCluster)
	default:
		return nil, fmt.Errorf("installer: invalid cluster kind %s", o.ClusterKind)
	}
	err := json.Unmarshal(o.ClusterData, cluster)
	return cluster, err
}

func createHandler(s Store, noConfig bool) ctxh.ContextHandler {
	fn := func(ctx context.Context, w http.ResponseWriter, req *http.Request) *ctxh.AppError {
		if req.Method != "POST" {
			return ctxh.NewAppError(nil, "POST method required", http.StatusMethodNotAllowed)
		}

		op, err := decodeCreateOp(req)
		if err != nil {
			return ctxh.NewAppError(err, "failed to parse body", http.StatusBadRequest)
		}

		cluster, err := op.Cluster()
		if err != nil {
			return ctxh.NewAppError(err, "failed to parse cluster data", http.StatusBadRequest)
		}

		if err := cluster.AssertValid(); err != nil {
			return ctxh.NewAppError(err, err.Error(), http.StatusBadRequest)
		}

		// error if a cluster has already been created successfully
		_, exists := s.GetCluster(cluster.Kind())
		if exists {
			return ctxh.NewAppError(nil, "already created a cluster", http.StatusConflict)
		}

		// generate assets
		if err := cluster.GenerateAssets(); err != nil {
			return ctxh.NewAppError(err, "failed to generate assets", http.StatusBadRequest)
		}

		if noConfig {
			log.Info("running in no config mode, bootcfg will not be contacted")
		} else {
			// write machine groups, profiles, and ignition to bootcfg
			client, err := NewBootcfgClient(&BootcfgConfig{
				Endpoint:   op.BootcfgRPC,
				CA:         []byte(op.BootcfgCA),
				ClientCert: []byte(op.BootcfgClientCert),
				ClientKey:  []byte(op.BootcfgClientKey),
			})
			if err != nil {
				return ctxh.NewAppError(err, "error creating bootcfg client connection", http.StatusBadRequest)
			}
			defer client.Close()

			if err := client.ClusterManifests(ctx, cluster); err != nil {
				return ctxh.NewAppError(err, "failed to configure bootcfg", http.StatusBadRequest)
			}
		}

		// add the cluster to the Store
		s.AddCluster(cluster.Kind(), cluster)
		return nil
	}
	return ctxh.ContextHandlerFuncWithError(fn)
}

func decodeCreateOp(req *http.Request) (*CreateOperation, error) {
	op := new(CreateOperation)
	err := json.NewDecoder(req.Body).Decode(op)
	return op, err
}
