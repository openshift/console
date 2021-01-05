package dynamic

import (
	"io/ioutil"
	"log"
	"reflect"
	"testing"

	"github.com/stretchr/testify/require"
	"gotest.tools/assert"
	"sigs.k8s.io/yaml"
)

func TestYaml(t *testing.T) {
	yamlFile, err := ioutil.ReadFile("./fixtures/sample.yaml")
	require.NoError(t, err)

	cfg := &Configuration{}
	err = yaml.Unmarshal(yamlFile, cfg)

	log.Printf("test %v", cfg)
	// log.Fatal(cfg)
	cfgCopy := cfg
	assert.Equal(t, reflect.ValueOf(cfgCopy), reflect.ValueOf(cfg))
	assert.Equal(t, reflect.ValueOf(cfgCopy), reflect.ValueOf(cfg))
	assert.Equal(t, cfgCopy, cfg)

	// Update cfg
	cfg.Routers["powpow"] = &Router{}
	assert.Equal(t, reflect.ValueOf(cfgCopy), reflect.ValueOf(cfg))
	assert.Equal(t, reflect.ValueOf(cfgCopy), reflect.ValueOf(cfg))
	assert.Equal(t, cfgCopy, cfg)

}
