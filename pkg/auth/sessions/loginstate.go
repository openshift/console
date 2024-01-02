package sessions

import (
	"encoding/json"
	"fmt"
	"time"
)

// for unit testing
type nowFunc func() time.Time

// loginState represents the current login state of a user.
// None of the serializable fields contain any sensitive information,
// and should be safe to send as a non-http-only cookie.
type LoginState struct {
	userID       string
	name         string
	email        string
	exp          time.Time
	now          nowFunc
	sessionToken string
	rawToken     string
}

type LoginJSON struct {
	UserID string `json:"userID"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Exp    int64  `json:"exp"`
}

// NewRawLoginState creates a new login state in cases where the access token
// is just an opaque string.
func NewRawLoginState(accessToken string) *LoginState {
	return &LoginState{
		rawToken: accessToken,
	}
}

// newLoginState unpacks a token and generates a new loginState from it.
func NewLoginState(rawToken string, claims []byte) (*LoginState, error) {
	ls := &LoginState{
		now:      time.Now,
		rawToken: rawToken,
	}

	var c struct {
		Subject string   `json:"sub"`
		Expiry  jsonTime `json:"exp"`
		Email   string   `json:"email"`
		Name    string   `json:"name"`
	}

	if err := json.Unmarshal(claims, &c); err != nil {
		return nil, fmt.Errorf("error getting claims from token: %v", err)
	}

	if c.Subject == "" {
		return nil, fmt.Errorf("token missing require claim 'sub'")
	}

	ls.userID = c.Subject
	ls.email = c.Email
	ls.exp = time.Time(c.Expiry)
	ls.name = c.Name
	return ls, nil
}

func (ls *LoginState) UserID() string {
	return ls.userID
}

func (ls *LoginState) Username() string {
	return ls.name
}

func (ls *LoginState) Expiry() time.Time {
	return ls.exp
}

func (ls *LoginState) AccessToken() string {
	return ls.rawToken
}

func (ls *LoginState) SessionToken() string {
	return ls.sessionToken
}

func (ls *LoginState) IsExpired() bool {
	return ls.now().After(ls.exp)
}

func (ls *LoginState) ToLoginJSON() LoginJSON {
	return LoginJSON{
		UserID: ls.userID,
		Name:   ls.name,
		Email:  ls.email,
		Exp:    ls.exp.Unix(),
	}
}

// jsonTime copied from github.com/coreos/go-oidc

type jsonTime time.Time

func (j *jsonTime) UnmarshalJSON(b []byte) error {
	var n json.Number
	if err := json.Unmarshal(b, &n); err != nil {
		return err
	}
	var unix int64

	if t, err := n.Int64(); err == nil {
		unix = t
	} else {
		f, err := n.Float64()
		if err != nil {
			return err
		}
		unix = int64(f)
	}
	*j = jsonTime(time.Unix(unix, 0))
	return nil
}
