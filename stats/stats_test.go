package stats

import "testing"

var (
	goodCfg []byte = []byte(`{
 "quay.io": {
  "auth": "bmFtZSBwYXJ0Omdvb2Z5IHRyYWlsaW5nIHBhcnQK",
  "email": ""
 }
}`)

	notJSONCfg []byte = []byte(`This isn't even JSON`)

	weirdJSONCfg []byte = []byte(`{
 "Nope": {
  "auth": "bmFtZSBwYXJ0Omdvb2Z5IHRyYWlsaW5nIHBhcnQK",
  "email": ""
 }
}`)

	badBase64Cfg []byte = []byte(`{
 "quay.io": {
  "auth": "+-_/\][bmFtZSBwYXJ0Omdvb2Z5=IHRyYWlsaW5nIHBhcnQK",
  "email": ""
 }
}`)

	unexpectedAuthFormatCfg []byte = []byte(`{
 "quay.io": {
  "auth": "d2l0aG91dCBhIGNvbG9uLCBub3RoaW5nIGludGVyZXN0aW5nIGNhbiBoYXBwZW4K",
  "email": ""
 }
}`)

	emptyNameCfg []byte = []byte(`{
 "quay.io": {
  "auth": "OmEgbGVhZGluZyBjb2xvbiBpcyBwcm9iYWJseSBjb3JydXB0Cg==",
  "email": ""
 }
}`)
)

func TestStatsParseGood(t *testing.T) {
	name, err := parseNameFromDockercfg(goodCfg)

	if err != nil {
		t.Errorf("Expected clean result, got: %v", err)
	}

	if name != "name part" {
		t.Errorf("Expected to read name, got: %s", name)
	}
}

func TestStatsParseNotJSON(t *testing.T) {
	name, err := parseNameFromDockercfg(notJSONCfg)
	if err == nil {
		t.Errorf("Expected error, got: %s", name)
	}
}

func TestStatsParseWeirdJSON(t *testing.T) {
	name, err := parseNameFromDockercfg(weirdJSONCfg)
	if err == nil {
		t.Errorf("Expected error, got: %s", name)
	}
}

func TestStatsParseBadBase64(t *testing.T) {
	name, err := parseNameFromDockercfg(badBase64Cfg)
	if err == nil {
		t.Errorf("Expected error, got: %s", name)
	}
}

func TestStatsParseUnexpectedAuthFormat(t *testing.T) {
	name, err := parseNameFromDockercfg(unexpectedAuthFormatCfg)
	if err == nil {
		t.Errorf("Expected error, got: %s", name)
	}
}

func TestStatsParseEmptyNameCfg(t *testing.T) {
	name, err := parseNameFromDockercfg(emptyNameCfg)
	if err == nil {
		t.Errorf("Expected error, got: %s", name)
	}
}
