package serrors

import (
	"errors"
	"fmt"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
)

func TestErrorMethod(t *testing.T) {
	tests := []struct {
		serr soyError
		want string
	}{
		{
			serr: soyError{typ: Internal, inner: errors.New("Something bad happened.")},
			want: "Internal Error: Something bad happened.",
		},
		{
			serr: soyError{typ: NotFound, inner: errors.New("The XYZ you requested was not found.")},
			want: "Not Found: The XYZ you requested was not found.",
		},
		// no type
		{
			serr: soyError{inner: errors.New("Something weird happened.")},
			want: "Unknown Error: Something weird happened.",
		},
		// no inner error
		{
			serr: soyError{typ: NotFound},
			want: "Not Found",
		},
		// with desc
		{
			serr: soyError{typ: NotFound, desc: "Some user friendly message.", inner: errors.New("The XYZ you requested was not found.")},
			want: "Not Found: The XYZ you requested was not found. - Some user friendly message.",
		},
	}

	for i, tt := range tests {
		got := tt.serr.Error()
		if tt.want != got {
			t.Errorf("case %d: wrong error string, want: %q got: %q", i, tt.want, got)
		}
	}
}

func TestNew(t *testing.T) {
	tests := []struct {
		typ   errorType
		inner error
	}{
		{
			typ:   PermissionDenied,
			inner: errors.New("invalid db access... stack trace... lost of garbage"),
		},
		{
			typ:   Validation,
			inner: errors.New("missing required field: foo"),
		},
		// no type
		{
			typ:   Unknown,
			inner: errors.New("invalid db access... stack trace... lost of garbage"),
		},
		// nil inner
		{
			typ:   PermissionDenied,
			inner: nil,
		},
	}

	for i, tt := range tests {
		got := New(tt.typ, tt.inner)
		serr, ok := got.(soyError)
		if !ok {
			t.Errorf("case %d: unable to conver to soyError: %v", i, got)
		}

		if serr.desc != "" {
			t.Errorf("case %d: unexpected description on soyError: %s", i, serr.desc)
		}

		if tt.typ != serr.typ {
			t.Errorf("case %d: wrong type, want: %s got: %s", i, tt.typ, serr.typ)
		}

		if tt.inner != serr.inner {
			t.Errorf("case %d: wrong inner error, want: %s got: %s", i, tt.inner, serr.inner)
		}
	}
}

func TestErrorf(t *testing.T) {
	tests := []struct {
		typ   errorType
		inner error
		fmts  string
		args  []interface{}
	}{
		{
			typ:   Validation,
			inner: errors.New("big hairy database error..."),
			fmts:  "missing required field(s): %s, %s",
			args:  []interface{}{"monkeys", "banannas"},
		},
		// no fmt string args
		{
			typ:   Validation,
			inner: errors.New("big hairy database error..."),
			fmts:  "missing required field(s): %s, %s",
		},
		// no fmt string or args
		{
			typ:   Validation,
			inner: errors.New("big hairy database error..."),
		},
		// no type
		{
			typ:   Unknown,
			inner: errors.New("invalid db access... stack trace... lost of garbage"),
		},
		// nil inner
		{
			typ:   PermissionDenied,
			inner: nil,
		},
	}

	for i, tt := range tests {
		got := Errorf(tt.typ, tt.inner, tt.fmts, tt.args...)
		serr, ok := got.(soyError)
		if !ok {
			t.Errorf("case %d: unable to conver to soyError: %v", i, got)
		}

		wantDesc := fmt.Sprintf(tt.fmts, tt.args...)
		if wantDesc != serr.desc {
			t.Errorf("case %d: unexpected description, want: %s, got: %s", i, wantDesc, serr.desc)
		}

		if tt.typ != serr.typ {
			t.Errorf("case %d: wrong type, want: %q got: %q", i, tt.typ, serr.typ)
		}

		if tt.inner != serr.inner {
			t.Errorf("case %d: wrong inner error, want: %s got: %s", i, tt.inner, serr.inner)
		}
	}
}

func TestTypeOf(t *testing.T) {
	tests := []struct {
		err      error
		wantType errorType
	}{
		{
			err:      soyError{typ: Internal},
			wantType: Internal,
		},
		{
			err:      soyError{typ: NotFound},
			wantType: NotFound,
		},
		{
			err:      errors.New("NOT A SOY ERROR!"),
			wantType: Unknown,
		},
	}

	for i, tt := range tests {
		gotType := TypeOf(tt.err)
		if tt.wantType != gotType {
			t.Errorf("case %d: wrong type, want: %s got: %s", i, tt.wantType, gotType)
		}
	}
}

func TestInnerError(t *testing.T) {
	innerA := errors.New("inner error A")
	innerB := errors.New("inner error B")

	tests := []struct {
		err  error
		want error
	}{
		{
			err:  soyError{inner: innerA},
			want: innerA,
		},
		{
			err:  soyError{inner: innerB},
			want: innerB,
		},
		{
			err:  innerA,
			want: innerA,
		},
		{
			err:  nil,
			want: nil,
		},
	}

	for i, tt := range tests {
		got := Inner(tt.err)
		if tt.want != got {
			t.Errorf("case %d: wrong inner error, want: %v got: %v", i, tt.want, got)
		}
	}
}

func TestRPC(t *testing.T) {
	tests := []struct {
		err      error
		wantCode codes.Code
		wantDesc string
	}{
		// nil inner error, no desc
		{
			err:      New(PermissionDenied, nil),
			wantCode: codes.PermissionDenied,
			wantDesc: fmt.Sprintf("%s: %s", PermissionDenied, defaultDesc),
		},
		// has inner error, no desc
		{
			err:      New(AlreadyExists, errors.New("big hair inner error...")),
			wantCode: codes.AlreadyExists,
			wantDesc: fmt.Sprintf("%s: %s", AlreadyExists, defaultDesc),
		},
		// nil inner error, has desc
		{
			err:      Errorf(Internal, nil, "something bad happened"),
			wantCode: codes.Internal,
			wantDesc: fmt.Sprintf("%s: %s", Internal, "something bad happened"),
		},
		// nil inner error, has desc with args
		{
			err:      Errorf(Internal, nil, "something bad happened about: %s", "you"),
			wantCode: codes.Internal,
			wantDesc: fmt.Sprintf("%s: %s", Internal, "something bad happened about: you"),
		},
		// missing error type
		{
			err:      Errorf("", errors.New("inner error"), "this is bad: %s", "usage"),
			wantCode: codes.Unknown,
			wantDesc: fmt.Sprintf("%s: %s", Unknown, "this is bad: usage"),
		},
		// has inner error, has desc with args
		{
			err:      Errorf(NotFound, errors.New("inner error: not here"), "couldn't find the: %s", "keys"),
			wantCode: codes.NotFound,
			wantDesc: fmt.Sprintf("%s: %s", NotFound, "couldn't find the: keys"),
		},
	}

	for i, tt := range tests {
		got := RPC(tt.err)

		gotCode := grpc.Code(got)
		if tt.wantCode != gotCode {
			t.Errorf("case %d: wrong grpc error code, want: %v got: %v", i, tt.wantCode, gotCode)
		}

		gotDesc := grpc.ErrorDesc(got)
		if tt.wantDesc != gotDesc {
			t.Errorf("case %d: wrong grpc error desc, want: %q got: %q", i, tt.wantDesc, gotDesc)
		}
	}
}
