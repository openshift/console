package file

import (
	"fmt"
	"testing"
	"time"

	"github.com/openshift/console/pkg/config/dynamic"
	"github.com/stretchr/testify/assert"
)

type ProvideTestCase struct {
	directory string
	file      string
}

func TestProvideWithWatch(t *testing.T) {
	for _, test := range getTestCases() {
		t.Run("  "+test.directory+test.file+"  with watch", func(t *testing.T) {
			provider := &Provider{}
			provider.Watch = true
			// provider.Directory = "./fixtures/"
			provider.Filename = "./fixtures/test.yml"
			t.Log(provider)
			configChan := make(chan dynamic.Message, 5)
			// errorChan := make(chan struct{})
			go func() {
				err := provider.Provide(configChan)
				assert.NoError(t, err)
			}()

			timeout := time.After(time.Second * 30)
			go func() {
				for {
					conf := <-configChan
					for name, val := range conf.Configuration.Routers {
						fmt.Println(name, val)
					}
				}
			}()

			select {
			case <-timeout:
				t.Log("end")
			}

			// t.Error(conf.Configuration.Routers)
			// timeout := time.After(1 * time.Second)
			// select {
			// case conf := <-configChan:
			// 	require.NotNil(t, conf.Configuration.Routers)
			// 	numRouters := len(conf.Configuration.Routers)
			// 	assert.Equal(t, numRouters, 0)
			// 	for name, value := range conf.Configuration.Routers {
			// 		// log.Println(conf.Configuration.Routers)
			// 		t.Logf(name, value)
			// 	}
			// case <-timeout:
			// 	t.Fatal("timeout while waiting for config")
			// case <-errorChan:
			// }

		})
	}
}

func getTestCases() []ProvideTestCase {
	return []ProvideTestCase{
		{
			directory: "./fixtures/",
			file:      "test",
		},
	}
}
