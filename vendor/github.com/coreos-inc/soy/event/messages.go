package event

type AccountEvent struct {
	BFAccountID string `json:"bf_account_id"`
}

type SubscriptionEvent struct {
	BFAccountID    string `json:"bf_account_id"`
	SubscriptionID string `json:"subscription_id"`
}
