package crypto

// this file is copied over from:
//   https://github.com/openshift/library-go/blob/11013d437d762f00827c7e80d18b0a7b0abc07bd/pkg/crypto/crypto.go#L122
// we may want to consider importing library-go and using this package
// directly as we would gain any effort maintaining this list.
import (
	"crypto/tls"
)

func DefaultCiphers() []uint16 {
	// HTTP/2 mandates TLS 1.2 or higher with an AEAD cipher
	// suite (GCM, Poly1305) and ephemeral key exchange (ECDHE, DHE) for
	// perfect forward secrecy. Servers may provide additional cipher
	// suites for backwards compatibility with HTTP/1.1 clients.
	// See RFC7540, section 9.2 (Use of TLS Features) and Appendix A
	// (TLS 1.2 Cipher Suite Black List).
	return []uint16{
		tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
		tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
		tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256, // required by http/2
		tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
		tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
		tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256, // forbidden by http/2, not flagged by http2isBadCipher() in go1.8
		tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256,   // forbidden by http/2, not flagged by http2isBadCipher() in go1.8
		tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,    // forbidden by http/2
		tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,    // forbidden by http/2
		tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,      // forbidden by http/2
		tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,      // forbidden by http/2
		tls.TLS_RSA_WITH_AES_128_GCM_SHA256,         // forbidden by http/2
		tls.TLS_RSA_WITH_AES_256_GCM_SHA384,         // forbidden by http/2
		// the next one is in the intermediate suite, but go1.8 http2isBadCipher() complains when it is included at the recommended index
		// because it comes after ciphers forbidden by the http/2 spec
		// tls.TLS_RSA_WITH_AES_128_CBC_SHA256,
		// tls.TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA, // forbidden by http/2, disabled to mitigate SWEET32 attack
		// tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,       // forbidden by http/2, disabled to mitigate SWEET32 attack
		tls.TLS_RSA_WITH_AES_128_CBC_SHA, // forbidden by http/2
		tls.TLS_RSA_WITH_AES_256_CBC_SHA, // forbidden by http/2
	}
}
