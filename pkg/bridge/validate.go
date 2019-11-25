package bridge

import (
	"fmt"
	"net/url"

	"k8s.io/klog"
)

func ValidateFlagNotEmpty(name string, value string) string {
	if value == "" {
		FlagFatalf(name, "value is required")
	}

	return value
}

func ValidateFlagIsURL(name string, value string) *url.URL {
	ValidateFlagNotEmpty(name, value)

	ur, err := url.Parse(value)
	if err != nil {
		FlagFatalf(name, "%v", err)
	}

	if ur == nil || ur.String() == "" || ur.Scheme == "" || ur.Host == "" {
		FlagFatalf(name, "malformed URL")
	}

	return ur
}

func ValidateFlagIs(name string, value string, expectedValues ...string) string {
	if len(expectedValues) != 1 {
		for _, v := range expectedValues {
			if v == value {
				return value
			}
		}
		FlagFatalf(name, "value must be one of %s, not %s", expectedValues, value)
	}
	if value != expectedValues[0] {
		FlagFatalf(name, "value must be %s, not %s", expectedValues[0], value)
	}

	return value
}

func FlagFatalf(name string, format string, a ...interface{}) {
	klog.Fatalf("Invalid flag: %s, error: %s", name, fmt.Sprintf(format, a...))
}
