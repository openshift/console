package zendesk

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
)

type UserRole string

var (
	UserRoleAdmin   = UserRole("admin")
	UserRoleAgent   = UserRole("agent")
	UserRoleEndUser = UserRole("end-user")
)

type User struct {
	ID             int      `json:"id"`
	Name           string   `json:"name"`
	ExternalID     string   `json:"external_id"`
	Verified       bool     `json:"verified"`
	Email          string   `json:"email"`
	Phone          string   `json:"phone"`
	OrganizationID int      `json:"organization_id,omitempty"`
	Role           UserRole `json:"role"`
}

type UserAPI interface {
	ListByExternalID(string) ([]User, error)
	Search(string) ([]User, error)
	Create(User) (User, error)
	Modify(User) (User, error)
}

type httpUserAPI struct {
	client *Client
}

func (o *httpUserAPI) ListByExternalID(externalID string) ([]User, error) {
	u := o.client.baseURL()
	u.Path = "/api/v2/users/show_many.json"
	v := u.Query()
	v.Set("external_ids", externalID)
	u.RawQuery = v.Encode()

	var resp usersResponse
	err := o.queryUsers(u, &resp)
	if err != nil {
		return nil, err
	}
	return []User(resp), nil
}

func (o *httpUserAPI) Search(query string) ([]User, error) {
	u := o.client.baseURL()
	u.Path = "/api/v2/search.json"
	v := u.Query()
	v.Set("query", fmt.Sprintf("type:user %s", query))
	u.RawQuery = v.Encode()

	var resp usersSearchResponse
	err := o.queryUsers(u, &resp)
	if err != nil {
		return nil, err
	}
	return []User(resp), nil
}

func (o *httpUserAPI) queryUsers(u url.URL, response interface{}) error {
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return fmt.Errorf("failed creating HTTP request: %v", err)
	}

	res, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP request failed: %v", err)
	}
	defer res.Body.Close()

	err = checkForAPIError(res)
	if err != nil {
		return err
	}

	if err := json.NewDecoder(res.Body).Decode(response); err != nil {
		return fmt.Errorf("failed unmarshaling JSON response: %v", err)
	}

	return nil
}

func (o *httpUserAPI) Create(usr User) (User, error) {
	cr := userRequest(usr)
	b, err := json.Marshal(&cr)
	if err != nil {
		return User{}, fmt.Errorf("failed marshaling JSON request: %v", err)
	}

	u := o.client.baseURL()
	u.Path = "/api/v2/users.json"

	req, err := http.NewRequest("POST", u.String(), bytes.NewReader(b))
	if err != nil {
		return User{}, fmt.Errorf("failed creating HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	res, err := o.client.Do(req)
	if err != nil {
		return User{}, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer res.Body.Close()

	err = checkForAPIError(res)
	if err != nil {
		return User{}, err
	}

	var ur userResponse
	if err := json.NewDecoder(res.Body).Decode(&ur); err != nil {
		return User{}, fmt.Errorf("failed unmarshaling JSON response: %v", err)
	}

	return User(ur), nil
}

func (o *httpUserAPI) Modify(usr User) (User, error) {
	cr := userRequest(usr)
	b, err := json.Marshal(&cr)
	if err != nil {
		return User{}, fmt.Errorf("failed marshaling JSON request: %v", err)
	}

	u := o.client.baseURL()
	u.Path = fmt.Sprintf("/api/v2/users/%d.json", usr.ID)

	req, err := http.NewRequest("PUT", u.String(), bytes.NewReader(b))
	if err != nil {
		return User{}, fmt.Errorf("failed creating HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	res, err := o.client.Do(req)
	if err != nil {
		return User{}, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer res.Body.Close()

	err = checkForAPIError(res)
	if err != nil {
		return User{}, err
	}

	var ur userResponse
	if err := json.NewDecoder(res.Body).Decode(&ur); err != nil {
		return User{}, fmt.Errorf("failed unmarshaling JSON response: %v", err)
	}

	return User(ur), nil
}

type userResponse User

func (r *userResponse) UnmarshalJSON(d []byte) error {
	var dec struct {
		User *User `json:"user"`
	}
	if err := json.Unmarshal(d, &dec); err != nil {
		return err
	}
	if dec.User == nil {
		return errors.New("object does not contain user")
	}
	*r = userResponse(*dec.User)
	return nil
}

type usersResponse []User

func (r *usersResponse) UnmarshalJSON(d []byte) error {
	var dec struct {
		Users []User `json:"users"`
	}
	if err := json.Unmarshal(d, &dec); err != nil {
		return err
	}
	*r = usersResponse(dec.Users)
	return nil
}

type usersSearchResponse []User

func (r *usersSearchResponse) UnmarshalJSON(d []byte) error {
	var dec struct {
		Results []User `json:"results"`
	}
	if err := json.Unmarshal(d, &dec); err != nil {
		return err
	}
	*r = usersSearchResponse(dec.Results)
	return nil
}

type userRequest User

func (r *userRequest) MarshalJSON() ([]byte, error) {
	cr := struct {
		Name           string   `json:"name"`
		ExternalID     string   `json:"external_id"`
		Verified       bool     `json:"verified"`
		Email          string   `json:"email"`
		Phone          string   `json:"phone"`
		OrganizationID int      `json:"organization_id,omitempty"`
		Role           UserRole `json:"role"`
	}{
		Name:           r.Name,
		ExternalID:     r.ExternalID,
		Verified:       r.Verified,
		Email:          r.Email,
		Phone:          r.Phone,
		OrganizationID: r.OrganizationID,
		Role:           r.Role,
	}
	return json.Marshal(map[string]interface{}{"user": cr})
}
