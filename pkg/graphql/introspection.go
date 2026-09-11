package graphql

import (
	"context"
	"errors"
	"strings"

	graphql "github.com/graph-gophers/graphql-go"
)

// introspectionFieldNames are the GraphQL introspection meta-fields (__schema,
// __type) and the Apollo Federation service field (_service) that must be
// rejected. The __typename meta-field is intentionally omitted: it must always
// be allowed (it is required to resolve unions and interfaces) and is injected
// into most selection sets by Apollo Client.
var introspectionFieldNames = map[string]struct{}{
	"__schema": {},
	"__type":   {},
	"_service": {},
}

// graphQLSubscriber is the subset of *graphql.Schema that the graphql-ws
// websocket transport uses to execute operations. It mirrors the graphqlws
// connection.GraphQLService interface (which is defined in an internal package
// and therefore cannot be referenced directly).
type graphQLSubscriber interface {
	Subscribe(ctx context.Context, document string, operationName string, variableValues map[string]interface{}) (<-chan interface{}, error)
}

// introspectionBlocker wraps a graphQLSubscriber and rejects GraphQL
// introspection queries sent over the graphql-ws websocket transport.
//
// graph-gophers/graphql-go v1.5.0 only honors graphql.DisableIntrospection() on
// the HTTP (Exec) path. Its Subscribe path -- which the console also uses to run
// ordinary queries over the websocket -- executes with introspection enabled
// regardless, so the schema can be enumerated over the websocket even though it
// is blocked over plain HTTP. This wrapper closes that gap by rejecting
// introspection documents before they reach the schema.
//
// The leak is fixed upstream in graphql-go v1.6.0+ (shipped in OpenShift 4.19
// and later, which are not affected), so this guard is only needed on branches
// pinned to v1.5.0. See https://issues.redhat.com/browse/OCPBUGS-113759.
type introspectionBlocker struct {
	subscriber graphQLSubscriber
}

// NewIntrospectionBlocker returns a graphql-ws service that rejects introspection
// queries before delegating to the wrapped schema's Subscribe.
func NewIntrospectionBlocker(schema *graphql.Schema) *introspectionBlocker {
	return &introspectionBlocker{subscriber: schema}
}

// Subscribe rejects any operation whose document selects an introspection
// meta-field and otherwise delegates to the wrapped subscriber. It satisfies the
// graphqlws connection.GraphQLService interface.
func (b *introspectionBlocker) Subscribe(ctx context.Context, document string, operationName string, variableValues map[string]interface{}) (<-chan interface{}, error) {
	if selectsIntrospectionField(document) {
		return nil, errors.New("GraphQL introspection is disabled")
	}
	return b.subscriber.Subscribe(ctx, document, operationName, variableValues)
}

// selectsIntrospectionField reports whether the GraphQL document references an
// introspection meta-field as an actual name token. It scans the document while
// skipping comments and string values (both regular and block strings) so that
// an introspection name appearing only inside a comment or a string argument
// does not cause a legitimate query to be rejected.
func selectsIntrospectionField(document string) bool {
	for i := 0; i < len(document); {
		c := document[i]
		switch {
		case c == '#':
			// Comment: skip to end of line.
			for i < len(document) && document[i] != '\n' {
				i++
			}
		case c == '"':
			i = skipString(document, i)
		case isNameStart(c):
			start := i
			i++
			for i < len(document) && isNameContinue(document[i]) {
				i++
			}
			if _, ok := introspectionFieldNames[document[start:i]]; ok {
				return true
			}
		default:
			i++
		}
	}
	return false
}

// skipString advances past a GraphQL string value that begins at index i (which
// must point at a '"') and returns the index of the first character after it. It
// handles both regular strings ("...") with backslash escapes and block strings
// ("""...""") with the \""" escape sequence.
func skipString(document string, i int) int {
	if strings.HasPrefix(document[i:], `"""`) {
		i += 3
		for i < len(document) {
			if strings.HasPrefix(document[i:], `\"""`) {
				i += 4
				continue
			}
			if strings.HasPrefix(document[i:], `"""`) {
				return i + 3
			}
			i++
		}
		return i
	}

	i++ // opening quote
	for i < len(document) {
		switch document[i] {
		case '\\':
			i += 2
		case '"':
			return i + 1
		case '\n':
			return i // unterminated string; stop scanning this token
		default:
			i++
		}
	}
	return i
}

// isNameStart reports whether b can start a GraphQL name (/[_A-Za-z]/).
func isNameStart(b byte) bool {
	return b == '_' || (b >= 'A' && b <= 'Z') || (b >= 'a' && b <= 'z')
}

// isNameContinue reports whether b can continue a GraphQL name (/[_0-9A-Za-z]/).
func isNameContinue(b byte) bool {
	return isNameStart(b) || (b >= '0' && b <= '9')
}
