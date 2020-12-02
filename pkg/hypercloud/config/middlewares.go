package config

type Middleware struct {
	StripPrefix       *StripPrefix       `json:"stripPrefix,omitempty" toml:"stripPrefix,omitempty" yaml:"stripPrefix,omitempty"`
	Chain             *Chain             `json:"chain,omitempty" toml:"chain,omitempty" yaml:"chain,omitempty"`

	Plugin map[string]PluginConf `json:"plugin,omitempty" toml:"plugin,omitempty" yaml:"plugin,omitempty"`
}

type Chain struct {
	Middlewares []string `json:"middlewares,omitempty" toml:"middlewares,omitempty" yaml:"middlewares,omitempty"`
}