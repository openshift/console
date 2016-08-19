package util

import (
	"os"
	"strings"

	"github.com/spf13/pflag"
)

func SetFlagsFromEnv(prefix string, fs *pflag.FlagSet) error {
	// don't override flags set by command line flags
	alreadySet := make(map[string]bool)
	fs.Visit(func(f *pflag.Flag) { alreadySet[f.Name] = true })

	var err error
	fs.VisitAll(func(f *pflag.Flag) {
		if err != nil || alreadySet[f.Name] {
			return
		}
		key := prefix + strings.ToUpper(strings.Replace(f.Name, "-", "_", -1))
		if val := os.Getenv(key); val != "" {
			err = fs.Set(f.Name, val)
		}
	})
	return err
}
