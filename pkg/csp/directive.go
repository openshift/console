package csp

import (
	"fmt"
	"regexp"
	"strings"
)

// CSPDirective is based on the w3c spec fof Content Security Policy:
// https://w3c.github.io/webappsec-csp/#framework-directives

const (
	namePattern  = "^[a-zA-Z0-9-]+$"
	valuePattern = "^[\x21-\x2B\x2D-\x3A\x3C-\x7E]+$"
)

type Directive struct {
	name  string
	value []string
}

func validateName(n string) bool {
	pattern := regexp.MustCompile(namePattern)
	return pattern.MatchString(n)
}

func validateValue(v string) bool {
	pattern := regexp.MustCompile(valuePattern)
	return pattern.MatchString(v)
}

func NewDirective(name string, values ...string) (*Directive, error) {
	if !validateName(name) {
		return nil, fmt.Errorf("invalid CSP directive name: %v", name)
	}

	directive := &Directive{
		name:  name,
		value: []string{},
	}

	err := directive.AddValues(values...)
	if err != nil {
		return nil, err
	}

	return directive, nil
}

func (c *Directive) AddValues(values ...string) error {
	for _, value := range values {
		if !validateValue(value) {
			return fmt.Errorf("invalid CSP directive value: %v", value)
		}
	}
	c.value = append(c.value, values...)
	return nil
}

func (c *Directive) ToString() string {
	return strings.Join(append([]string{c.name}, c.value...), " ")
}
