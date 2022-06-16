package serverconfig

import (
	"errors"
	"flag"
	"fmt"
	"math/rand"
	"os"
	"reflect"
	"testing"
)

func TestMultiKeyValueSetter(t *testing.T) {
	tests := []struct {
		name          string
		input         string
		expected      MultiKeyValue
		expectedError error
	}{
		{
			name:          "Should ignore an empty string",
			input:         "",
			expected:      MultiKeyValue{},
			expectedError: nil,
		},
		{
			name:  "Should accept and split key=value pair",
			input: "key=value",
			expected: MultiKeyValue{
				"key": "value",
			},
			expectedError: nil,
		},
		{
			name:  "Should accept multiple comma-separated key=value pairs",
			input: "key1=value1,key2=value2",
			expected: MultiKeyValue{
				"key1": "value1",
				"key2": "value2",
			},
			expectedError: nil,
		},
		{
			name:  "Should automatically trim spaces between key=value pairs",
			input: "key1=value1, key2=value2, ",
			expected: MultiKeyValue{
				"key1": "value1",
				"key2": "value2",
			},
			expectedError: nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := MultiKeyValue{}
			actualError := actual.Set(test.input)
			if !reflect.DeepEqual(test.expected, actual) {
				t.Errorf("Data does not match expectation:\n%v\nbut got\n%v", test.expected, actual)
			}
			if test.expectedError == nil && actualError != nil {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
			} else if test.expectedError != nil && (actualError == nil || test.expectedError.Error() != actualError.Error()) {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
			}
		})
	}
}

// Set is called multiple times when parsing the config file
func TestCallingMultiKeyValueSetterMultipleTimes(t *testing.T) {
	actual := MultiKeyValue{}
	actual.Set("plugin-a=Service1")
	actual.Set("plugin-b=Service2 ")
	actual.Set("plugin-c=Service3, plugin-d=Service4, ")
	expected := MultiKeyValue{
		"plugin-a": "Service1",
		"plugin-b": "Service2",
		"plugin-c": "Service3",
		"plugin-d": "Service4",
	}
	if !reflect.DeepEqual(expected, actual) {
		t.Errorf("Data does not match expectation:\n%v\nbut got\n%v", expected, actual)
	}
}

func TestDefaultValue(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")

	args := []string{}
	Parse(fs, args, prefix)

	if *userAuth != "default value" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "default value")
	}
}

func TestCliArgument(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")

	args := []string{"-user-auth", "openshift"}
	Parse(fs, args, prefix)

	if *userAuth != "openshift" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift")
	}
}

func TestEnvVariable(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")

	args := []string{}
	os.Setenv(fmt.Sprintf("%s_USER_AUTH", prefix), "openshift")
	Parse(fs, args, prefix)

	if *userAuth != "openshift" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift")
	}
}

func TestCliArgumentOverridesEnvVariable(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")

	args := []string{"-user-auth", "openshift-cli"}
	os.Setenv(fmt.Sprintf("%s_USER_AUTH", prefix), "openshift-env")
	Parse(fs, args, prefix)

	if *userAuth != "openshift-cli" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift-cli")
	}
}

func TestCliArgumentToParseConfig(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{"-config", "test/bind-address-config.yaml"}
	Parse(fs, args, prefix)

	// Parsing a configfile automatically switches to 'openshift' user auth
	if *userAuth != "openshift" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift")
	}
	// Value from config file
	if *listen != "http://localhost:9000" {
		t.Errorf("Unexpected value: actual %s, expected %s", *listen, "http://localhost:9000")
	}
}

func TestCliArgumentOverridesParsedConfig(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{"-config", "test/bind-address-config.yaml", "-user-auth", "openshift-cli"}
	Parse(fs, args, prefix)

	// Note: Parsing a configfile automatically switches to 'openshift' user auth
	if *userAuth != "openshift-cli" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift-cli")
	}
	// Value from config file
	if *listen != "http://localhost:9000" {
		t.Errorf("Unexpected value: actual %s, expected %s", *listen, "http://localhost:9000")
	}
}

func TestEnvVariableToParseConfig(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{}
	os.Setenv(fmt.Sprintf("%s_CONFIG", prefix), "test/bind-address-config.yaml")
	Parse(fs, args, prefix)

	// Parsing a configfile automatically switches to 'openshift' user auth
	if *userAuth != "openshift" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift")
	}
	// Value from config file
	if *listen != "http://localhost:9000" {
		t.Errorf("Unexpected value: actual %s, expected %s", *listen, "http://localhost:9000")
	}
}

func TestEnvVariableOverridesParsedConfig(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{}
	os.Setenv(fmt.Sprintf("%s_CONFIG", prefix), "test/bind-address-config.yaml")
	os.Setenv(fmt.Sprintf("%s_USER_AUTH", prefix), "openshift-env")
	Parse(fs, args, prefix)

	// Note: Parsing a configfile automatically switches to 'openshift' user auth
	if *userAuth != "openshift-env" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift-env")
	}
	// Value from config file
	if *listen != "http://localhost:9000" {
		t.Errorf("Unexpected value: actual %s, expected %s", *listen, "http://localhost:9000")
	}
}

func TestCliArgumentsOverridesEnvVariablesAndParsedConfig(t *testing.T) {
	prefix := fmt.Sprintf("TEST_PREFIX_%d", rand.Int())
	fs := flag.NewFlagSet(prefix, flag.ContinueOnError)
	fs.String("config", "", "The config file.")
	userAuth := fs.String("user-auth", "default value", "")
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{"-config", "test/bind-address-config.yaml", "-user-auth", "openshift-cli"}
	os.Setenv(fmt.Sprintf("%s_CONFIG", prefix), "test/does-not-exist.yaml")
	os.Setenv(fmt.Sprintf("%s_USER_AUTH", prefix), "openshift-env")
	Parse(fs, args, prefix)

	// Note: Parsing a configfile automatically switches to 'openshift' user auth
	if *userAuth != "openshift-cli" {
		t.Errorf("Unexpected value: actual %s, expected %s", *userAuth, "openshift-cli")
	}
	// Value from config file
	if *listen != "http://localhost:9000" {
		t.Errorf("Unexpected value: actual %s, expected %s", *listen, "http://localhost:9000")
	}
}

func TestSetFlagsFromConfig(t *testing.T) {
	tests := []struct {
		name               string
		config             Config
		expectedFlagValues map[string]string
		expectedError      error
	}{
		{
			name:               "Should fail for unsupported config files",
			config:             Config{},
			expectedFlagValues: map[string]string{},
			expectedError:      errors.New("unsupported version (apiVersion: , kind: ), only console.openshift.io/v1 ConsoleConfig is supported"),
		},
		{
			name: "Should consume an empty ConsoleConfig",
			config: Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
			},
			expectedFlagValues: map[string]string{},
			expectedError:      nil,
		},
		{
			name: "Should apply plugins",
			config: Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				Plugins: MultiKeyValue{
					"plugin-a": "ServiceA",
					"plugin-b": "ServiceB",
				},
			},
			expectedFlagValues: map[string]string{
				"plugins": "plugin-a=ServiceA, plugin-b=ServiceB",
			},
			expectedError: nil,
		},
		{
			name: "Should apply telemetry configuration",
			config: Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				Telemetry: MultiKeyValue{
					"A_CONFIG_KEY":       "value1",
					"ANOTHER_CONFIG_KEY": "value2",
					"disabled":           "true",
				},
			},
			expectedFlagValues: map[string]string{
				"telemetry": "ANOTHER_CONFIG_KEY=value2, A_CONFIG_KEY=value1, disabled=true",
			},
			expectedError: nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			fs := &flag.FlagSet{}
			fs.String("config", "", "")
			fs.Var(&MultiKeyValue{}, "plugins", "")
			fs.Var(&MultiKeyValue{}, "telemetry", "")

			actualError := SetFlagsFromConfig(fs, test.config)
			actual := make(map[string]string)
			fs.Visit(func(f *flag.Flag) { actual[f.Name] = f.Value.String() })

			if !reflect.DeepEqual(test.expectedFlagValues, actual) {
				t.Errorf("FlagSet values does not match expectation:\n%v\nbut got\n%v", test.expectedFlagValues, actual)
			}
			if test.expectedError == nil && actualError != nil {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
			} else if test.expectedError != nil && (actualError == nil || test.expectedError.Error() != actualError.Error()) {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
			}
		})
	}
}
