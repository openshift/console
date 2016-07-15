package collector

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/health"
	"github.com/gorilla/handlers"
	"github.com/julienschmidt/httprouter"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/stats"
)

var (
	StatsEndpoint   = "/api/v1/stats"
	HealthEndpoint  = "/health"
	VersionEndpoint = "/version"

	StatsMetadataFieldReceivedAt   = "received_at"
	StatsMetadataFieldReceivedFrom = "received_from"
)

type APIServer struct {
	Host       string
	RecordRepo stats.RecordRepo
	Version    string
}

func (s *APIServer) Name() string {
	return "Stats API Server"
}

func (s *APIServer) Start() error {
	lw := &logWriter{
		log:   log,
		level: capnslog.INFO,
	}
	handler := handlers.LoggingHandler(lw, s.newHandler())
	srv := &http.Server{
		Addr:    s.Host,
		Handler: handler,
	}

	log.Infof("%s binding to %s", s.Name(), srv.Addr)

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			log.Errorf("%s exited uncleanly: %v", s.Name(), err)
		} else {
			log.Infof("%s exited cleanly", s.Name())
		}
	}()

	return nil
}

func (s *APIServer) newHandler() http.Handler {
	m := httprouter.New()
	m.Handle("POST", StatsEndpoint, s.storeRecordHandler())
	m.Handle("GET", HealthEndpoint, s.healthHandler())
	m.Handle("GET", VersionEndpoint, s.versionHandler())
	return m
}

func (s *APIServer) storeRecordHandler() httprouter.Handle {
	handle := func(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err)
			return
		}

		var rec stats.Record
		if err := json.Unmarshal(body, &rec); err != nil {
			WriteError(w, http.StatusBadRequest, err)
			return
		}

		if rec.Metadata == nil {
			rec.Metadata = make(map[string]string)
		}
		rec.Metadata[StatsMetadataFieldReceivedAt] = strconv.FormatInt(time.Now().Unix(), 10)
		rec.Metadata[StatsMetadataFieldReceivedFrom] = r.Header.Get("X-Real-IP")

		if log.LevelAt(capnslog.DEBUG) {
			logRecord(&rec)
		}

		if err := s.RecordRepo.Store(rec); err != nil {
			WriteError(w, http.StatusInternalServerError, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
	return ContentTypeMiddleware(handle, "application/json")
}

func logRecord(r *stats.Record) {
	mb, err := json.Marshal(r.Metadata)
	metadata := string(mb)
	if err != nil {
		metadata = "N/A"
	}
	pb, err := json.Marshal(r.Payload)
	payload := string(pb)
	if err != nil {
		payload = "N/A"
	}
	accountID := r.AccountID
	if accountID == "" {
		accountID = "N/A"
	}
	log.Debugf("received record: accountID=%s metadata=%s payload=%s", accountID, metadata, payload)
}

func (s *APIServer) healthHandler() httprouter.Handle {
	hc := health.Checker{
		Checks: []health.Checkable{
			&nopHealthCheckable{},
		},
	}

	return func(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
		hc.ServeHTTP(w, r)
	}
}

type nopHealthCheckable struct{}

func (c *nopHealthCheckable) Healthy() error {
	//TODO(bcwaldon): fill this in
	return nil
}

func (s *APIServer) versionHandler() httprouter.Handle {
	return func(w http.ResponseWriter, _ *http.Request, _ httprouter.Params) {
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte(s.Version)); err != nil {
			log.Errorf("failed writing version response: %v", err)
		}
	}
}
