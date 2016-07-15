package stats

import "encoding/json"

type Record struct {
	AccountID     string
	AccountSecret string
	Metadata      map[string]string
	Payload       interface{}
}

func (r *Record) UnmarshalJSON(d []byte) error {
	var jr jsonRecord
	if err := json.Unmarshal(d, &jr); err != nil {
		return err
	}

	r.AccountID = jr.AccountID
	r.AccountSecret = jr.AccountSecret
	r.Metadata = jr.Metadata
	r.Payload = jr.Payload

	return nil
}

func (r *Record) MarshalJSON() ([]byte, error) {
	b, err := json.Marshal(r.Payload)
	if err != nil {
		return nil, err
	}
	msg := json.RawMessage(b)

	jr := jsonRecord{
		AccountID:     r.AccountID,
		AccountSecret: r.AccountSecret,
		Metadata:      r.Metadata,
		Payload:       &msg,
	}

	return json.Marshal(&jr)
}

type jsonRecord struct {
	AccountID     string            `json:"accountID"`
	AccountSecret string            `json:"accountSecret"`
	Metadata      map[string]string `json:"metadata"`
	Payload       *json.RawMessage  `json:"payload"`
}
