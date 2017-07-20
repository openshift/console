package server

import (
	"io/ioutil"
	"testing"
)

func TestKubeConfigTempl(t *testing.T) {
	if err := NewKubeConfigTmpl(
		"tectonic_cluster_name",
		"client_foo",
		"client_foo_secret",
		"https://k8s.example.com",
		"https://dex.example.com",
		nil, nil,
	).Execute(ioutil.Discard, "id_token", "refresh_token"); err != nil {
		t.Errorf("failed to execute template: %v", err)
	}

	if err := NewKubeConfigTmpl(
		"tectonic_cluster_name",
		"client_foo",
		"client_foo_secret",
		"https://k8s.example.com",
		"https://dex.example.com",
		[]byte("foobar"),
		[]byte("barfoo"),
	).Execute(ioutil.Discard, "id_token", "refresh_token"); err != nil {
		t.Errorf("failed to execute template: %v", err)
	}
}
