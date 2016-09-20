// This is copied from https://github.com/coreos-inc/tectonic-stats-collector/tree/ab5c1d4f2cc36cea32b366ec65bdfd21642f70be/pkg/generator
package generator

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"time"

	kclient "k8s.io/kubernetes/pkg/client/unversioned"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/stats"
)

var (
	DefaultGenerationInterval = time.Hour

	StatsMetadataFieldGeneratedAt = "generated_at"
)

type TectonicPayload struct {
	KubernetesNodes []node `json:"kubernetesNodes"`
	ClusterID       string `json:"clusterID"`
}

type Config struct {
	AccountID       string
	AccountSecret   string
	ClusterID       string
	Interval        time.Duration
	CollectorScheme string
	CollectorHost   string
}

func (cfg *Config) CollectorURL() url.URL {
	return url.URL{Scheme: cfg.CollectorScheme, Host: cfg.CollectorHost}
}

func (cfg *Config) CollectorHTTPClient() *http.Client {
	return http.DefaultClient
}

func (cfg *Config) Valid() error {
	if cfg.AccountID == "" {
		return errors.New("generator config invalid: empty account ID")
	}
	if cfg.AccountSecret == "" {
		return errors.New("generator config invalid: empty account secret")
	}
	if cfg.ClusterID == "" {
		return errors.New("generator config invalid: empty cluster ID")
	}
	if cfg.Interval == time.Duration(0) {
		return errors.New("generator config invalid: invalid generation interval")
	}
	if cfg.CollectorScheme != "http" && cfg.CollectorScheme != "https" {
		return errors.New("generator config invalid: invalid collector scheme, must be http/https")
	}
	if cfg.CollectorHost == "" {
		return errors.New("generator config invalid: empty collector host")
	}
	return nil
}

func New(cfg Config) (*generator, error) {
	if err := cfg.Valid(); err != nil {
		return nil, err
	}

	kc, err := kclient.NewInCluster()
	if err != nil {
		return nil, err
	}
	kcw := &kubernetesClientWrapper{client: kc}

	rRepo, err := NewHTTPRecordRepo(cfg.CollectorHTTPClient(), cfg.CollectorURL())
	if err != nil {
		return nil, err
	}

	gen := generator{
		config:     cfg,
		recordRepo: rRepo,
		nodeLister: kcw,
	}

	return &gen, nil
}

type generator struct {
	config     Config
	nodeLister nodeLister
	recordRepo stats.RecordRepo
}

func (g *generator) Run() {
	log.Infof("started stats generator")
	for {
		log.Infof("next attempt in %v", g.config.Interval)
		<-time.After(g.config.Interval)

		p, err := g.payload()
		if err != nil {
			log.Errorf("failed generating stats: %v", err)
			continue
		}

		if err = g.send(p); err != nil {
			log.Errorf("failed sending stats: %v", err)
			continue
		}

		log.Infof("stats successfully sent to collector")
	}
	return
}

func (g *generator) payload() (TectonicPayload, error) {
	nodes, err := g.nodeLister.List()
	if err != nil {
		return TectonicPayload{}, err
	}

	//TODO(bcwaldon): add license and cluster version info
	p := TectonicPayload{
		ClusterID:       g.config.ClusterID,
		KubernetesNodes: nodes,
	}

	return p, nil
}

func (g *generator) send(p TectonicPayload) error {
	m := map[string]string{
		StatsMetadataFieldGeneratedAt: strconv.FormatInt(time.Now().Unix(), 10),
	}

	r := stats.Record{
		AccountID:     g.config.AccountID,
		AccountSecret: g.config.AccountSecret,
		Metadata:      m,
		Payload:       p,
	}

	return g.recordRepo.Store(r)
}
