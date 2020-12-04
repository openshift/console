package backend

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/vulcand/predicate"
)

var funcs = map[string]func(*mux.Route, ...string) error{
	"Path":       path,
	"PathPrefix": pathPrefix,
}

type Router struct {
	*mux.Router
	parser predicate.Parser
}

// NewRouter returns a new router instance.
func NewRouter() (*Router, error) {
	parser, err := newParser()
	if err != nil {
		return nil, err
	}

	return &Router{
		Router: mux.NewRouter().SkipClean(true),
		parser: parser,
	}, nil
}

// AddRoute add a new route to the router.
func (r *Router) AddRoute(rule string, priority int, handler http.Handler) error {
	parse, err := r.parser.Parse(rule)
	if err != nil {
		return fmt.Errorf("error while parsing rule %s: %v", rule, err)
	}

	buildTree, ok := parse.(treeBuilder)
	if !ok {
		return fmt.Errorf("error while parsing rule %s", rule)
	}

	if priority == 0 {
		priority = len(rule)
	}

	route := r.NewRoute().Handler(handler)
	return addRuleOnRoute(route, buildTree())
}

type tree struct {
	matcher   string
	value     []string
	ruleLeft  *tree
	ruleRight *tree
}

func path(route *mux.Route, paths ...string) error {
	rt := route.Subrouter()

	for _, path := range paths {
		tmpRt := rt.Path(path)
		if tmpRt.GetError() != nil {
			return tmpRt.GetError()
		}
	}
	return nil
}

func pathPrefix(route *mux.Route, paths ...string) error {
	rt := route.Subrouter()

	for _, path := range paths {
		tmpRt := rt.PathPrefix(path)
		if tmpRt.GetError() != nil {
			return tmpRt.GetError()
		}
	}
	return nil
}

func addRuleOnRouter(router *mux.Router, rule *tree) error {
	switch rule.matcher {
	case "and":
		route := router.NewRoute()
		err := addRuleOnRoute(route, rule.ruleLeft)
		if err != nil {
			return err
		}

		return addRuleOnRoute(route, rule.ruleRight)
	case "or":
		err := addRuleOnRouter(router, rule.ruleLeft)
		if err != nil {
			return err
		}

		return addRuleOnRouter(router, rule.ruleRight)
	default:
		err := checkRule(rule)
		if err != nil {
			return err
		}

		return funcs[rule.matcher](router.NewRoute(), rule.value...)
	}
}

func addRuleOnRoute(route *mux.Route, rule *tree) error {
	switch rule.matcher {
	case "and":
		err := addRuleOnRoute(route, rule.ruleLeft)
		if err != nil {
			return err
		}

		return addRuleOnRoute(route, rule.ruleRight)
	case "or":
		subRouter := route.Subrouter()

		err := addRuleOnRouter(subRouter, rule.ruleLeft)
		if err != nil {
			return err
		}

		return addRuleOnRouter(subRouter, rule.ruleRight)
	default:
		err := checkRule(rule)
		if err != nil {
			return err
		}

		return funcs[rule.matcher](route, rule.value...)
	}
}

func checkRule(rule *tree) error {
	if len(rule.value) == 0 {
		return fmt.Errorf("no args for matcher %s", rule.matcher)
	}

	for _, v := range rule.value {
		if len(v) == 0 {
			return fmt.Errorf("empty args for matcher %s, %v", rule.matcher, rule.value)
		}
	}
	return nil
}
