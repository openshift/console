package utils

import (
	"crypto/rand"
	"encoding/base64"
)

// Generate a cryptographically secure random array of bytes.
func RandomBytes(length int) ([]byte, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	return bytes, err
}

// Generate a cryptographically secure random string.
// Returned string is encoded using [encoding.RawURLEncoding]
// which makes it safe to use in URLs and file names.
func RandomString(length int) (string, error) {
	encoding := base64.RawURLEncoding
	// each byte (8 bits) gives us 4/3 base64 (6 bits) characters,
	// we account for that conversion and add one to handle truncation
	b64size := encoding.DecodedLen(length) + 1
	randomBytes, err := RandomBytes(b64size)
	// trim down to the original requested size since we added one above
	return encoding.EncodeToString(randomBytes)[:length], err
}
