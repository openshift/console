package dynamic

// +k8s:deepcopy-gen=true

// Message holds configuration information exchanged between parts of console
type Message struct {
	ProviderName  string
	Configuration *Configuration
}

// +k8s:deepcopy-gen=true

// Configurations is for currentConfigurations Map.
type Configurations map[string]*Configuration

// +k8s:deepcopy-gen=true

// HTTPConfiguration contains all the HTTP configuration parameters.
type Configuration struct {
	Routers map[string]*Router `json:"routers,omitempty" toml:"routers,omitempty" yaml:"routers,omitempty" export:"true"`
}

// +k8s:deepcopy-gen=true

// Router holds the router configuration.
type Router struct {
	// Middlewares []string `json:"middlewares,omitempty" toml:"middlewares,omitempty" yaml:"middlewares,omitempty" export:"true"`
	Server string `json:"server,omitempty" toml:"server,omitempty" yaml:"server,omitempty" export:"true"`
	Rule   string `json:"rule,omitempty" toml:"rule,omitempty" yaml:"rule,omitempty"`
	Path   string `json:"path,omitempty" yaml:"path,omitempty"`
	// Priority    int              `json:"priority,omitempty" toml:"priority,omitempty,omitzero" yaml:"priority,omitempty" export:"true"
}
