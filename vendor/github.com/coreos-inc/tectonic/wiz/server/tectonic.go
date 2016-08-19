package server

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"net/http"
	gohttputil "net/http/httputil"
	"net/url"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/pkg/health"
	"github.com/coreos/pkg/httputil"
	"github.com/coreos/pkg/k8s-tlsutil"
	httprouter "github.com/julienschmidt/httprouter"
	v1 "k8s.io/kubernetes/pkg/api/v1"
)

const tectonicRootPath = "/tectonic/"

type tectonicHandler struct {
	path          string
	httpHandler   http.Handler
	writer        Writer
	statusChecker StatusChecker
	logger        *logrus.Entry
	submitTime    time.Time
}

func NewTectonicHandler(writer Writer, statusChecker StatusChecker, logger *logrus.Entry) *tectonicHandler {
	t := &tectonicHandler{path: tectonicRootPath}
	r := httprouter.New()

	r.POST("/tectonic/generate-self-signed-certificate", t.generateSelfSignedCertificate)
	r.POST("/tectonic/submit", t.submit)
	r.GET("/tectonic/proxy", t.proxy)

	t.httpHandler = http.Handler(r)
	t.logger = logger
	t.writer = writer
	t.statusChecker = statusChecker

	return t
}

func (t *tectonicHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	t.httpHandler.ServeHTTP(w, r)
}

func (t *tectonicHandler) Path() string {
	return t.path
}

func (t *tectonicHandler) Health() []health.Checkable {
	return []health.Checkable{t}
}

func (t *tectonicHandler) Healthy() error {
	return t.statusChecker.Check()
}

func (t *tectonicHandler) generateSelfSignedCertificate(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var payload GenerateSelfSignedCertificateRequest
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&payload)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Error decoding request.", t.logger)
		return
	}

	key, err := k8stlsutil.NewPrivateKey()
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Error generating private key.", t.logger)
		return
	}

	config := k8stlsutil.CertConfig{
		CommonName:   payload.CommonName,
		Organization: []string{payload.OrganizationName},
	}

	var cert *x509.Certificate

	if payload.CACert != "" && payload.CAKey != "" {
		caCert, err := k8stlsutil.ParsePEMEncodedCACert([]byte(payload.CACert))
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Error parsing CA certificate.", t.logger)
			return
		}

		caKey, err := k8stlsutil.ParsePEMEncodedPrivateKey([]byte(payload.CAKey))
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Error parsing CA private key.", t.logger)
			return
		}

		_cert, err := k8stlsutil.NewSignedCertificate(config, key, caCert, caKey, 0)
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Error generating signed certificate.", t.logger)
			return
		}

		cert = _cert
	} else {
		_cert, err := k8stlsutil.NewSelfSignedCACertificate(config, key, 0)
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Error generating self-signed certificate.", t.logger)
			return
		}

		cert = _cert
	}

	httputil.WriteJSONResponse(w, http.StatusOK, GenerateSelfSignedCertificateResponse{
		Cert: string(k8stlsutil.EncodeCertificatePEM(cert)),
		Key:  string(k8stlsutil.EncodePrivateKeyPEM(key)),
	})
}

func (t *tectonicHandler) submit(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var payload Payload
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&payload)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Error decoding request.", t.logger)
		return
	}

	namespaceMap := make(map[string]v1.Namespace)
	secretMap := make(map[string]v1.Secret)
	configMapMap := make(map[string]v1.ConfigMap)

	for _, pv := range payload {
		if pv.Kind == "" || pv.Name == "" || pv.Namespace == "" || pv.Key == "" || pv.Value == "" {
			t.logger.WithField("payloadValue", pv).Warning("Missing required payload data. Skipping this payload.")
			continue
		}
		t.logger.Debugf("namespace: %q, kind: %q, name: %q, key: %q, value: %q\n\n", pv.Namespace, pv.Kind, pv.Name, pv.Key, pv.Value)

		if _, ok := namespaceMap[pv.Namespace]; !ok {
			namespaceMap[pv.Namespace] = v1.Namespace{
				ObjectMeta: v1.ObjectMeta{
					Name: pv.Namespace,
				},
			}
		}

		switch pv.Kind {
		case "ConfigMap":
			cm, ok := configMapMap[pv.Name]
			if !ok {
				cm = v1.ConfigMap{
					ObjectMeta: v1.ObjectMeta{
						Name:      pv.Name,
						Namespace: pv.Namespace,
					},
					Data: make(map[string]string),
				}
				configMapMap[pv.Name] = cm
			}
			if _, ok := cm.Data[pv.Key]; ok {
				t.logger.WithField("value", pv.Value).Warning("Duplicate ConfigMap value found, overriding previous.")
			}
			val := pv.Value
			if pv.Encoding == "base64" {
				val = base64.StdEncoding.EncodeToString([]byte(val))
			}
			cm.Data[pv.Key] = val

		case "Secret":
			sc, ok := secretMap[pv.Name]
			if !ok {
				sc = v1.Secret{
					ObjectMeta: v1.ObjectMeta{
						Name:      pv.Name,
						Namespace: pv.Namespace,
					},
					Type: v1.SecretType(pv.Type),
					Data: make(map[string][]byte),
				}
				if sc.Type == "" {
					sc.Type = v1.SecretTypeOpaque
				}
				secretMap[pv.Name] = sc
			}
			if _, ok := sc.Data[pv.Key]; ok {
				t.logger.WithField("value", pv.Value).Warning("Duplicate Secret value found, overriding previous.")
			}
			if pv.Type != "" && pv.Type != string(sc.Type) {
				t.logger.WithField("value", pv.Type).Warning("Secret type mismatch. Overriding with latest value.")
				sc.Type = v1.SecretType(pv.Type)
			}
			sc.Data[pv.Key] = []byte(pv.Value)
		}
	}

	namespaces := []v1.Namespace{}
	for _, ns := range namespaceMap {
		namespaces = append(namespaces, ns)
	}
	if err := t.writer.WriteNamespaces(namespaces); err != nil {
		t.logger.WithError(err).Error("Error writing namespaces")
		writeResponseWithBody(w, http.StatusInternalServerError, "Error during submission", t.logger)
		return
	}

	configMaps := []v1.ConfigMap{}
	for _, cm := range configMapMap {
		configMaps = append(configMaps, cm)
	}
	if err := t.writer.WriteConfigMaps(configMaps); err != nil {
		t.logger.WithError(err).Error("Error writing config maps")
		writeResponseWithBody(w, http.StatusInternalServerError, "Error during submission", t.logger)
		return
	}

	secrets := []v1.Secret{}
	for _, sc := range secretMap {
		secrets = append(secrets, sc)
	}
	if err := t.writer.WriteSecrets(secrets); err != nil {
		t.logger.WithError(err).Error("Error writing secrets")
		writeResponseWithBody(w, http.StatusInternalServerError, "Error during submission", t.logger)
		return
	}

	t.submitTime = time.Now()

	writeResponseWithBody(w, http.StatusOK, payload, t.logger)
}

func (t *tectonicHandler) proxy(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	target, err := url.Parse(r.FormValue("target"))
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Error parsing target.", t.logger)
		return
	}

	// default director joins req and target URL paths together
	// which isn't what we want so we stick to custom one
	director := func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = target.Path
		req.URL.RawQuery = target.RawQuery
	}

	proxy := gohttputil.ReverseProxy{Director: director}
	proxy.ServeHTTP(w, r)
}
