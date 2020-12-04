package config

type StripPrefix struct {
	Prefixes []string `json:"prefixes,omitempty" toml:"prefixes,omitempty" yaml:"prefixes,omitempty"`
}
