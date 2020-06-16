package crd

type CRDMeta struct {
	UID string `json:"uid"`
}

// CRDItem is a minimal CRD response that only returns the UID. This lets the
// client detect new CRDs without leaking anything about their contents.
type CRDItem struct {
	CRDMeta `json:"metadata"`
}

type CRDList struct {
	Items []CRDItem `json:"items"`
}
