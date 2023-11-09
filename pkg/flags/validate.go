package flags

import (
	"fmt"
	"net/url"

	"k8s.io/klog/v2"
)

const invalidFlagFmt = "invalid flag: %s, error: %v"

var _ error = &InvalidFlagError{}

type InvalidFlagError struct {
	flagName string
	reason   string
}

func NewRequiredFlagError(flagName string) *InvalidFlagError {
	return NewInvalidFlagError(flagName, "value is required")
}

func NewInvalidFlagError(flagName, reasonFmt string, fmtArgs ...interface{}) *InvalidFlagError {
	return &InvalidFlagError{flagName: flagName, reason: fmt.Sprintf(reasonFmt, fmtArgs...)}
}

func (e *InvalidFlagError) Error() string {
	return fmt.Sprintf(invalidFlagFmt, e.flagName, e.reason)
}

func ValidateFlagNotEmpty(flagName, value string) error {
	if len(value) == 0 {
		return NewRequiredFlagError(flagName)
	}
	return nil
}

func ValidateFlagIsURL(name string, value string, allowEmpty bool) (*url.URL, error) {
	if len(value) == 0 {
		if allowEmpty {
			return &url.URL{}, nil
		}
		return nil, NewRequiredFlagError(name)
	}

	ur, err := url.Parse(value)
	if err != nil {
		return nil, NewInvalidFlagError(name, err.Error())
	}

	if ur == nil || ur.String() == "" || ur.Scheme == "" || ur.Host == "" {
		return nil, NewInvalidFlagError(name, "malformed URL")
	}

	return ur, nil
}

func ValidateFlagIs(name string, value string, expectedValues ...string) error {
	if len(expectedValues) != 1 {
		for _, v := range expectedValues {
			if v == value {
				return nil
			}
		}
		return NewInvalidFlagError(name, "value must be one of %s, not %s", expectedValues, value)
	}
	if value != expectedValues[0] {
		return NewInvalidFlagError(name, "value must be %s, not %s", expectedValues[0], value)
	}

	return nil
}

func FatalIfFailed(err error) {
	if err != nil {
		klog.Fatalf(err.Error())
	}
}
