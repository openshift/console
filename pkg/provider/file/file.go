package file

import (
	"log"

	"github.com/fsnotify/fsnotify"
	"github.com/openshift/console/pkg/config/dynamic"
	"github.com/openshift/console/pkg/provider"
	"github.com/spf13/viper"
)

const providerName = "file"

var _ provider.Provider = (*Provider)(nil)

// Provider holds configurations of the provider.
type Provider struct {
	// Directory string `description:"Directory of dynamic configuration from one .yml files in a directory." yaml:"directory,omitempty" export:"true"`
	Filename string `description:"Load dynamic configuration from a file." json:"filename,omitempty" toml:"filename,omitempty" yaml:"filename,omitempty" export:"true"`
	Watch    bool   `description:"Watch provider." json:"watch,omitempty" toml:"watch,omitempty" yaml:"watch,omitempty" export:"true"`
}

// SetDefaults sets the default values.
func (p *Provider) SetDefaults() {
	p.Watch = true
	p.Filename = ""
	// p.Directory = "/go/src/github.com/openshift/console/"
}

// Init the provider.
func (p *Provider) Init() error {
	return nil
}

// Provide allows the file provider to provide configurations to traefik
// using the given configuration channel.
func (p *Provider) Provide(configurationChan chan<- dynamic.Message) error {
	var cfg *dynamic.Configuration
	// viper.SetConfigName(p.Filename)
	// viper.AddConfigPath(p.Directory)
	// viper.SetConfigType("yml")
	viper.SetConfigFile(p.Filename)

	err := viper.ReadInConfig()
	viper.Unmarshal(&cfg)
	configurationChan <- dynamic.Message{
		ProviderName:  "file",
		Configuration: cfg,
	}
	if err != nil {
		log.Println("failed to read config file, something is wrong")
		return err
	}

	if p.Watch == true {
		viper.WatchConfig()
		viper.OnConfigChange(func(event fsnotify.Event) {
			log.Println("config file changed:", event.Name)
			if err != nil {
				log.Println("filed to read config file, something is wrong")
			}
			cfg = &dynamic.Configuration{}
			viper.Unmarshal(&cfg)
			configurationChan <- dynamic.Message{
				ProviderName:  "file",
				Configuration: cfg,
			}
		})
	}
	return nil
}
