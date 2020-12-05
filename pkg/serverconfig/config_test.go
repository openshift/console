package serverconfig

import (
	"flag"
	"fmt"
	"math/rand"
	"os"
	"testing"
)

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
