package graphql

import (
	"context"
	"testing"
)

type fakeSubscriber struct {
	called bool
}

func (f *fakeSubscriber) Subscribe(ctx context.Context, document string, operationName string, variableValues map[string]interface{}) (<-chan interface{}, error) {
	f.called = true
	ch := make(chan interface{})
	close(ch)
	return ch, nil
}

func TestIntrospectionBlockerSubscribe(t *testing.T) {
	tests := []struct {
		name     string
		document string
		blocked  bool
	}{
		{
			name:     "schema introspection is blocked",
			document: `query IntrospectionCheck { __schema { queryType { name } mutationType { name } } }`,
			blocked:  true,
		},
		{
			name:     "type introspection is blocked",
			document: `query { __type(name: "Query") { name } }`,
			blocked:  true,
		},
		{
			name:     "aliased schema introspection is blocked",
			document: `query { s: __schema { types { name } } }`,
			blocked:  true,
		},
		{
			name:     "minified schema introspection is blocked",
			document: `{__schema{queryType{name}}}`,
			blocked:  true,
		},
		{
			name:     "federation service field is blocked",
			document: `query { _service { sdl } }`,
			blocked:  true,
		},
		{
			name:     "__typename is allowed",
			document: `query { console { __typename } }`,
			blocked:  false,
		},
		{
			name:     "introspection name inside a string argument is allowed",
			document: `query { urls(filter: "__schema") { key value } }`,
			blocked:  false,
		},
		{
			name:     "introspection name inside a block string argument is allowed",
			document: `query { urls(filter: """__type""") { key value } }`,
			blocked:  false,
		},
		{
			name:     "introspection name inside a comment is allowed",
			document: "query {\n  urls { key } # really not __schema here\n}",
			blocked:  false,
		},
		{
			name:     "ordinary query is allowed",
			document: `query GetURL { urls { key value } }`,
			blocked:  false,
		},
		{
			name:     "subscription is allowed",
			document: `subscription { pollURL { key value } }`,
			blocked:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fake := &fakeSubscriber{}
			blocker := &introspectionBlocker{subscriber: fake}

			_, err := blocker.Subscribe(context.Background(), tt.document, "", nil)

			if tt.blocked {
				if err == nil {
					t.Errorf("expected introspection document to be rejected, got no error")
				}
				if fake.called {
					t.Errorf("wrapped subscriber must not be called for a blocked document")
				}
			} else {
				if err != nil {
					t.Errorf("expected document to be allowed, got error: %v", err)
				}
				if !fake.called {
					t.Errorf("wrapped subscriber must be called for an allowed document")
				}
			}
		})
	}
}
