// serrors are Soy errors

package serrors

import (
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
)

type errorType string

func (t errorType) String() string {
	return string(t)
}

const (
	defaultDesc = "An unknown error occurred."
	defaultType = Unknown

	AlreadyExists      errorType = "Already Exists"
	Internal           errorType = "Internal Error"
	NotFound           errorType = "Not Found"
	PermissionDenied   errorType = "Permission Denied"
	Unauthenticated    errorType = "Unauthenticated"
	Unknown            errorType = "Unknown Error"
	Validation         errorType = "Validation Error"
	InternalValidation errorType = "Internal Validation Error"
)

// mapType maps ErrorTypes to a grpc error Code
func mapType(e errorType) codes.Code {
	switch e {
	case AlreadyExists:
		return codes.AlreadyExists
	case Internal:
		return codes.Internal
	case NotFound:
		return codes.NotFound
	case PermissionDenied:
		return codes.PermissionDenied
	case Unauthenticated:
		return codes.Unauthenticated
	case Unknown:
		return codes.Unknown
	case Validation:
		return codes.InvalidArgument
	case InternalValidation:
		return codes.Internal
	}
	return codes.Unknown
}

// Error is a wrapper that is a custom error type.
type soyError struct {
	inner error
	typ   errorType
	desc  string
}

func (e soyError) Error() string {
	typ := e.typ.String()
	if typ == "" {
		typ = Unknown.String()
	}
	if e.inner == nil {
		return typ
	}
	if e.desc == "" {
		return fmt.Sprintf("%s: %s", typ, e.inner.Error())
	}
	return fmt.Sprintf("%s: %s - %s", typ, e.inner.Error(), e.desc)
}

// New wraps another error with some type info only.
func New(t errorType, e error) error {
	return soyError{
		inner: e,
		typ:   t,
	}
}

// Errorf wraps another error with type info, and user-friendly description text.
func Errorf(t errorType, e error, format string, a ...interface{}) error {
	return soyError{
		inner: e,
		typ:   t,
		desc:  fmt.Sprintf(format, a...),
	}
}

// TypeOf attempts extraction of the errorType from the error.
// Returns Unknown if unable.
func TypeOf(e error) errorType {
	if e == nil {
		return Unknown
	}
	err, ok := e.(soyError)
	if !ok {
		return Unknown
	}
	return err.typ
}

// Inner attempts a custom error type conversion to extract the inner error.
func Inner(e error) error {
	err, ok := e.(soyError)
	if ok {
		return err.inner
	}
	return e
}

// RPC turns any error into an RPC error first attempting custom error type conversion.
func RPC(e error) error {
	desc := defaultDesc
	typ := defaultType
	code := mapType(typ)

	err, ok := e.(soyError)
	if ok {
		if err.desc != "" {
			desc = err.desc
		}
		if err.typ != "" {
			typ = err.typ
			code = mapType(typ)
		}
	}
	return grpc.Errorf(code, fmt.Sprintf("%s: %s", typ, desc))
}
