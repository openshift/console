package main

import (
	"crypto/tls"
)

var tlsGroupToCurveID = map[string]tls.CurveID{
	"X25519":             tls.X25519,
	"secp256r1":          tls.CurveP256,
	"secp384r1":          tls.CurveP384,
	"secp521r1":          tls.CurveP521,
	"X25519MLKEM768":     tls.X25519MLKEM768,
	"SecP256r1MLKEM768":  tls.SecP256r1MLKEM768,
	"SecP384r1MLKEM1024": tls.SecP384r1MLKEM1024,
}

// tlsCurvePreferences maps the configured TLS group names to Go tls.CurveID
// values. Group names the Go runtime does not recognize are collected in
// unsupported so the caller can log them; they are skipped rather than treated
// as fatal, so a group value this binary predates does not prevent the server
// from starting.
func tlsCurvePreferences(groups []string) (curves []tls.CurveID, unsupported []string) {
	for _, group := range groups {
		curve, ok := tlsGroupToCurveID[group]
		if !ok {
			unsupported = append(unsupported, group)
			continue
		}
		curves = append(curves, curve)
	}
	return curves, unsupported
}
