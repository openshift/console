package serverconfig

import (
	"errors"
	"flag"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"reflect"
	"testing"

	consolev1 "github.com/openshift/api/console/v1"
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

func TestCSPConfigPreservesSources(t *testing.T) {
	for _, source := range []string{
		"https://plugin.example.com/a,b",
		"https://plugin.example.com,script-src=https://other.example.com",
		"https://plugin.example.com/a%2Cb%3Bc",
	} {
		t.Run(source, func(t *testing.T) {
			fs := flag.NewFlagSet(t.Name(), flag.ContinueOnError)
			var csp MultiKeyValue
			fs.Var(&csp, "content-security-policy", "")
			config := &Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				ContentSecurityPolicy: map[consolev1.DirectiveType][]string{
					consolev1.ScriptSrc: {source, "'self'"},
				},
			}
			if err := SetFlagsFromConfig(fs, config); err != nil {
				t.Fatal(err)
			}
			if want := (MultiKeyValue{"script-src": source + " 'self'"}); !reflect.DeepEqual(csp, want) {
				t.Fatalf("configured sources were changed: got %v, want %v", csp, want)
			}
		})
	}
}

func TestCSPConfigPrecedence(t *testing.T) {
	for _, test := range []struct {
		name string
		env  string
		cli  string
		want string
	}{
		{"config", "", "", "https://yaml.example.com"},
		{"environment", "script-src=https://env.example.com", "", "https://env.example.com"},
		{"cli", "script-src=https://env.example.com", "script-src=https://cli.example.com", "https://cli.example.com"},
	} {
		t.Run(test.name, func(t *testing.T) {
			filename := filepath.Join(t.TempDir(), "console-config.yaml")
			if err := os.WriteFile(filename, []byte(`apiVersion: console.openshift.io/v1
kind: ConsoleConfig
contentSecurityPolicy:
  ScriptSrc: [https://yaml.example.com]
  FontSrc: [https://fonts.example.com]
`), 0600); err != nil {
				t.Fatal(err)
			}
			prefix := "TEST_CSP_PRECEDENCE"
			t.Setenv(prefix+"_CONTENT_SECURITY_POLICY", test.env)
			fs := flag.NewFlagSet(t.Name(), flag.ContinueOnError)
			fs.String("config", "", "")
			csp := MultiKeyValue{"img-src": "https://images.example.com"}
			fs.Var(&csp, "content-security-policy", "")
			args := []string{"--config", filename}
			if test.cli != "" {
				args = append(args, "--content-security-policy", test.cli)
			}
			if _, err := Parse(fs, args, prefix); err != nil {
				t.Fatal(err)
			}
			want := MultiKeyValue{
				"script-src": test.want,
				"font-src":   "https://fonts.example.com",
				"img-src":    "https://images.example.com",
			}
			if !reflect.DeepEqual(csp, want) {
				t.Fatalf("unexpected effective sources: got %v, want %v", csp, want)
			}
		})
	}
}

func TestCSPConfigRejectsIncompatibleFlag(t *testing.T) {
	for _, name := range []string{"missing", "wrong type"} {
		t.Run(name, func(t *testing.T) {
			fs := flag.NewFlagSet(t.Name(), flag.ContinueOnError)
			if name == "wrong type" {
				fs.String("content-security-policy", "", "")
			}
			config := &Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				ContentSecurityPolicy: map[consolev1.DirectiveType][]string{
					consolev1.ScriptSrc: {"https://plugin.example.com"},
				},
			}
			if err := SetFlagsFromConfig(fs, config); err == nil {
				t.Fatal("silently ignored CSP configuration with an incompatible flag")
			}
		})
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
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{"-config", "test/bind-address-config.yaml"}
	Parse(fs, args, prefix)

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
	listen := fs.String("listen", "http://0.0.0.0:9000", "")

	args := []string{}
	os.Setenv(fmt.Sprintf("%s_CONFIG", prefix), "test/bind-address-config.yaml")
	Parse(fs, args, prefix)

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
		{
			name: "Should apply additional console base addresses",
			config: Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				ClusterInfo: ClusterInfo{
					ConsoleBaseAddress: "https://console.example.com",
					AdditionalConsoleBaseAddresses: []string{
						"https://console-alt.example.com",
						"https://console.internal.example.com:8443",
					},
				},
			},
			expectedFlagValues: map[string]string{
				"base-address":              "https://console.example.com",
				"additional-base-addresses": "https://console-alt.example.com,https://console.internal.example.com:8443",
			},
			expectedError: nil,
		},
		{
			name: "Applies OLM lifecycle metadata when enabled",
			config: Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				ClusterInfo: ClusterInfo{
					OLMLifecycleMetadataEnabled: true,
				},
			},
			expectedFlagValues: map[string]string{
				"olm-lifecycle-metadata": "true",
			},
			expectedError: nil,
		},
		{
			name: "Should apply CSP configuration",
			config: Config{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsoleConfig",
				ContentSecurityPolicy: map[consolev1.DirectiveType][]string{
					"FontSrc":   {"value2", "value3"},
					"ScriptSrc": {"value1"},
				},
			},
			expectedFlagValues: map[string]string{
				"content-security-policy": "font-src=value2 value3, script-src=value1",
			},
			expectedError: nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			fs := &flag.FlagSet{}
			fs.String("config", "", "")
			fs.String("base-address", "", "")
			fs.String("additional-base-addresses", "", "")
			fs.Var(&MultiKeyValue{}, "plugins", "")
			fs.Var(&MultiKeyValue{}, "telemetry", "")
			fs.Var(&MultiKeyValue{}, "content-security-policy", "")
			fs.Bool("olm-lifecycle-metadata", false, "")

			actualError := SetFlagsFromConfig(fs, &test.config)
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
