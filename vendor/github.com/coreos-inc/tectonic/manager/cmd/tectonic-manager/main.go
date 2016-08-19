package main

import (
	goflag "flag"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
	"k8s.io/kubernetes/pkg/client/unversioned/clientcmd"
	cmdutil "k8s.io/kubernetes/pkg/kubectl/cmd/util"

	"github.com/coreos-inc/tectonic/manager/pkg/version"
)

const (
	binaryName = "tectonic-manager"
)

var (
	RootCmd = &cobra.Command{
		Use:   "tectonic-manager [command]",
		Short: "tectonic-manager manages various Tectonic components",
		Run: func(cmd *cobra.Command, args []string) {
			if printVersion {
				logger.Printf("%s version %s\n", binaryName, version.Version)
			}
		},
	}
	disableLicenseVerification bool
	printVersion               bool
	cfg                        Config
	kconfig                    clientcmd.ClientConfig
	logger                     *log.Logger
	stop                       chan struct{}
)

// Config contains overridable options that can be provided to tectonic-manager
type Config struct {
	LicenseFile     string
	ManifestDir     string
	EnableProfiling bool
	ListenAddr      string
}

func init() {
	RootCmd.Flags().BoolVar(&printVersion, "version", false, "Print version information and exit")
	RootCmd.PersistentFlags().StringVar(&cfg.ManifestDir, "manifest-dir", "/etc/tectonic/manifests", "Where the tectonic-system manifests live on the file-system")
	RootCmd.PersistentFlags().BoolVar(&cfg.EnableProfiling, "enable-profling", false, "Enable profiling")
	RootCmd.PersistentFlags().StringVar(&cfg.ListenAddr, "listen", "0.0.0.0:8080", "")

	kconfig = cmdutil.DefaultClientConfig(RootCmd.PersistentFlags())

	cobra.OnInitialize(initConfig)
}

func initConfig() {
	goflag.CommandLine.Parse([]string{})
	logger = log.New(os.Stdout, "", log.LstdFlags)
	if err := setFlagsFromEnv(RootCmd.Flags(), "TECTONIC"); err != nil {
		logger.Fatalf("env parsing failed: %v", err)
	}
	for _, cmd := range RootCmd.Commands() {
		if err := setFlagsFromEnv(cmd.Flags(), "TECTONIC"); err != nil {
			logger.Fatalf("env parsing failed: %v", err)
		}
	}
}

func main() {
	if err := RootCmd.Execute(); err != nil {
		log.Fatal(err)
	}
}

func setFlagsFromEnv(fs *pflag.FlagSet, prefix string) (err error) {

	alreadySet := make(map[string]bool)
	fs.Visit(func(f *pflag.Flag) {
		alreadySet[f.Name] = true
	})
	fs.VisitAll(func(f *pflag.Flag) {
		if !alreadySet[f.Name] {
			key := prefix + "_" + strings.ToUpper(strings.Replace(f.Name, "-", "_", -1))
			val := os.Getenv(key)
			if val != "" {
				if serr := fs.Set(f.Name, val); serr != nil {
					err = fmt.Errorf("invalid value %q for %s: %v", val, key, serr)
				}
			}
		}
	})
	return err
}

// httpGet returns true if url returns http 200, otherwise it logs any errors
// as they occurred and returns false
func httpGet(client *http.Client, url string) bool {
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Get(url)
	if err != nil {
		// Don't log temporary errors
		if nerr, ok := err.(net.Error); ok && (nerr.Temporary() || nerr.Timeout()) {
			return false
		}
		logger.Printf("unable to connect to %s, err: %v\n", url, err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return true
	} else {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			logger.Printf("error reading response body: %v\n", err)
			return false
		}
		logger.Printf("got HTTP %d back, response: %s\n", resp.StatusCode, string(body))
	}
	return false
}
