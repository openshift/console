package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"

	licensev2 "github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/tectonic/manager/pkg/joseutil"
	"github.com/coreos-inc/tectonic/manager/pkg/license"
)

var (
	// injected by build scripts
	VERSION = "UNKNOWN"
	now     = time.Now()
	lic     = &licensev2.License{
		SchemaVersion:  licensev2.LicenseSchemaVersion,
		Version:        "1337",
		CreationDate:   now,
		ExpirationDate: now.AddDate(1, 0, 0),
	}
)

func main() {
	fs := flag.NewFlagSet("tectonic-license", flag.ExitOnError)
	ver := fs.Bool("version", false, "Print version information and exit")
	decode := fs.Bool("decode", false, "Decode the JWT rather than printing a new signed JWT")
	key := fs.String("key", "", "Path to the key to sign or verify.")
	input := fs.String("input", "", "Path to the JWT to decode/verify or '-' to read from stdin")
	fs.StringVar(&lic.AccountID, "license-account-id", "", "Set the accountID field on the license")
	fs.StringVar(&lic.AccountSecret, "license-account-secret", "", "Set the accountSecret field on the license")

	if err := fs.Parse(os.Args[1:]); err != nil {
		stderr("flag parsing failed: %v", err)
		os.Exit(2)
	}

	if *ver {
		fmt.Printf("tectonic-license version %s\n", VERSION)
		os.Exit(0)
	}

	if *key == "" {
		stderr("must provide -key")
		os.Exit(1)
	}

	keyFile, err := os.Open(*key)
	if err != nil {
		stderr("error occurred when opening file: %s, err=%v", *input, err)
		os.Exit(2)
	}

	if *decode {
		var licenseFile io.Reader
		if *input == "-" {
			licenseFile = os.Stdin
		} else if *input != "" {
			licenseFile, err = os.Open(*input)
			if err != nil {
				stderr("error occurred when opening file: %s, err=%v", *input, err)
				os.Exit(2)
			}
		} else {
			stderr("must provide -input")
			os.Exit(2)
		}

		licenseDetails, err := license.Verify(keyFile, licenseFile)
		if err != nil {
			stderr("error occurred reading license: err=%v", err)
			os.Exit(2)
		}

		if licenseDetails.Version == license.LicenseVersion2 {
			log.Printf("license schema version: v2 (latest)")
			lic, err = licensev2.NewLicenseFromJWT(licenseDetails.LicenseJWT)
			if err != nil {
				stderr("error loading Tectonic license %v", err)
				os.Exit(2)
			}
			rawLicense, err := json.MarshalIndent(lic, "", " ")
			if err != nil {
				stderr("unable to get license from string: err=%v", err)
				os.Exit(1)
			}
			fmt.Println(string(rawLicense))
			os.Exit(0)
		} else {
			stderr("Unsupported license version for tectonic-license")
			os.Exit(1)
		}

	}

	if lic.AccountID == "" || lic.AccountSecret == "" {
		stderr("must provide both -license-account-id and -license-account-secret")
		os.Exit(2)
	}

	signer, err := joseutil.NewSigner(keyFile, "tectonic-enterprise")
	if err != nil {
		stderr("error occurred when creating signer: err=%v", err)
		os.Exit(2)
	}

	rawLicense, err := json.Marshal(lic)
	if err != nil {
		stderr(err.Error())
		os.Exit(2)
	}

	str, err := licensev2.NewSignedLicense(signer, licensev2.LicenseSchemaVersion, now, now.AddDate(1, 0, 0), rawLicense)
	if err != nil {
		stderr(err.Error())
		os.Exit(2)
	}

	fmt.Println(str)
}

type logger func(string, ...interface{})

func stderr(format string, args ...interface{}) {
	if !strings.HasSuffix(format, "\n") {
		format = format + "\n"
	}
	fmt.Fprintf(os.Stderr, format, args...)
}
