package stats

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io/ioutil"
	"strings"
	"time"

	"github.com/coreos/pkg/capnslog"

	genStats "github.com/coreos-inc/bridge/stats-generator"
)

var (
	log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "stats")
)

type dockerCfgId struct {
	QuayIO struct {
		Auth string
	} `json:"quay.io"`
}

func parseNameFromDockercfg(dockercfg []byte) (string, error) {
	var found dockerCfgId
	err := json.Unmarshal(dockercfg, &found)
	if err != nil {
		return "", err
	}

	auth := found.QuayIO.Auth
	decoded, err := base64.StdEncoding.DecodeString(auth)
	if err != nil {
		return "", err
	}

	split := strings.SplitN(string(decoded), ":", 2)
	if len(split) != 2 {
		return "", errors.New("dockercfg found but auth had an unrecognized format")
	}

	if len(split[0]) == 0 {
		return "", errors.New("dockercfg found but auth with a zero-length name")
	}

	return split[0], nil
}

func GenerateStats(idFile string) {
	rawId, err := ioutil.ReadFile(idFile)
	if err != nil || len(rawId) == 0 {
		log.Warningf("File %s couldn't be read. Your console may not be installed correctly.", idFile)
		return
	}

	name, err := parseNameFromDockercfg(rawId)
	var idString string
	if err == nil {
		idString = "QUAY||" + name
	} else {
		log.Warningf("Identity was in an unexpected format: %v", err)
		hash := hmac.New(sha512.New512_256, []byte("tectonic-console-file-id||"))
		hash.Write(rawId)
		idBytes := hash.Sum(nil)
		idString = "HASH||" + base64.StdEncoding.EncodeToString(idBytes)
	}

	gen, err := genStats.New(genStats.Config{
		AccountID:       idString + "||id",
		AccountSecret:   "[NO SECRET]",
		ClusterID:       idString + "||cluster",
		Interval:        time.Hour,
		CollectorScheme: "https",
		CollectorHost:   "usage.tectonic.com",
	})
	if err != nil {
		log.Warningf("Can't run identity support: %v", err)
		return
	}

	log.Infof("Running with identity [%s]", idString)
	gen.Run()
}
