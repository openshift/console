package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"
)

type nowFunc func() time.Time

func defaultNow() time.Time {
	return time.Now()
}

func maxAge(exp time.Time, curr time.Time) int {
	age := exp.Sub(curr)
	return int(age.Seconds())
}

func randomString(length int) string {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		panic(fmt.Sprintf("FATAL ERROR: Unable to get random bytes for session token: %v", err))
	}
	return base64.StdEncoding.EncodeToString(bytes)
}
