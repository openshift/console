package provider

import (
	"github.com/openshift/console/pkg/config/dynamic"
)

type Provider interface {
	// Provide allows the provider to provide configurations to console
	// using the given chfiguration channel.
	Provide(configuration chan<- dynamic.Message) error
	Init() error
}
