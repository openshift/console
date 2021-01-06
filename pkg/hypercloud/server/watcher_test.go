package server

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/openshift/console/pkg/config/dynamic"
	"github.com/traefik/traefik/v2/pkg/safe"
)

type mockProvider struct {
	messages []dynamic.Message
	wait     time.Duration
}

func (p *mockProvider) Provide(configurationChan chan<- dynamic.Message) error {
	for _, message := range p.messages {
		configurationChan <- message

		wait := p.wait
		if wait == 0 {
			wait = 20 * time.Millisecond
		}
		fmt.Println("wait", wait, time.Now().Nanosecond())
		time.Sleep(wait)
	}

	return nil
}

func (p *mockProvider) Init() error {
	panic("implement me")
}

func TestPublishConfigUpdatedByProvider(t *testing.T) {
	pvdConfiguration := dynamic.Configuration{
		Routers: map[string]*dynamic.Router{
			"foo": {},
		},
	}

	pvd := &mockProvider{
		wait: 10 * time.Millisecond,
		messages: []dynamic.Message{
			{
				ProviderName:  "mock",
				Configuration: &pvdConfiguration,
			},
			{
				ProviderName:  "mock",
				Configuration: &pvdConfiguration,
			},
		},
	}

	// pvd := &mockProvider{
	// 	messages: []dynamic.Message{
	// 		{
	// 			ProviderName: "mock",
	// 			Configuration: &dynamic.Configuration{
	// 				Routers: map[string]*dynamic.Router{
	// 					"name": {
	// 						Middlewares: []string{"etst", "ererer"},
	// 						Service:     "gahha",
	// 						Rule:        "dfdf",
	// 					},
	// 				},
	// 			},
	// 		},
	// 	},
	// }
	routinesPool := safe.NewPool(context.Background())
	watcher := NewWatcher(pvd, routinesPool)

	run := make(chan struct{})

	watcher.Start()
	test := <-watcher.configChan
	fmt.Println(test.Configuration)
	for name, value := range test.Configuration.Routers {
		fmt.Println(name, value)
	}
	<-run

}
