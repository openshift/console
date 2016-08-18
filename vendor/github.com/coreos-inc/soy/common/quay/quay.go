package quay

import (
	"encoding/base32"
	"fmt"
	"regexp"
	"strings"
)

const (
	RepositoryName = "quay.io"
)

var (
	// this is a copy of base32.StdEncoding but lowercase only to fit within quay's requirements
	quayEncoding  = base32.NewEncoding("abcdefghijklmnopqrstuvwxyz234567")
	quayNameRegex = regexp.MustCompile(`[^a-z0-9_]+`)
)

func ValidIdentifier(s string) bool {
	return !quayNameRegex.MatchString(s)
}

// Prefix is assumed to be normalized already
func NormalizeIdentifier(prefix, ident string) string {
	ident = fmt.Sprintf("%s%s", prefix, quayEncoding.EncodeToString([]byte(ident)))
	ident = strings.Replace(ident, "=", "", -1)
	if len(ident) > 30 {
		ident = ident[:30]
	}
	return ident
}
