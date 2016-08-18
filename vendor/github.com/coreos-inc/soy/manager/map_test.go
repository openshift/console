package manager

import (
	"testing"
	"time"

	"github.com/authclub/billforward/models"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
	"github.com/kylelemons/godebug/pretty"

	pb "github.com/coreos-inc/soy/proto"
	pbc "github.com/coreos-inc/soy/proto/common"
)

func TestAccountConversion(t *testing.T) {
	created1 := strfmt.DateTime(time.Unix(1454463011, 0))
	created2 := strfmt.DateTime(time.Unix(1454463011, 0))
	tests := []struct {
		bfa models.Account
		pba pb.Account
	}{
		{
			bfa: models.Account{
				ID:      swag.String("acct1-id"),
				Deleted: swag.Bool(true),
				// "2016-02-03T01:30:11Z"
				Created: created1,
				Metadata: models.DynamicMetadata{
					"quayID":          "acct1-quay-id",
					"newsletterEmail": true,
				},
				Profile: &models.Profile{
					ID:          swag.String("prof1-id"),
					AccountID:   swag.String("acct1-id"),
					CompanyName: "Foo Corp",
					Email:       swag.String("foo@fooinc.com"),
					FirstName:   swag.String("Foo"),
					LastName:    swag.String("Bar"),
					Landline:    "555-123-4567",
					Mobile:      "555-098-7654",
				},
			},
			pba: pb.Account{
				ID:              "acct1-id",
				QuayID:          "acct1-quay-id",
				NewsletterEmail: true,
				Deleted:         true,
				// "2016-02-03T01:30:11Z"
				CreatedAt: &pbc.Timestamp{
					Seconds: 1454463011,
					Nanos:   0,
				},
				Profile: &pb.Profile{
					ID:          "prof1-id",
					AccountID:   "acct1-id",
					CompanyName: "Foo Corp",
					Email:       "foo@fooinc.com",
					FirstName:   "Foo",
					LastName:    "Bar",
					Landline:    "555-123-4567",
					Mobile:      "555-098-7654",
				},
			},
		},
		{
			bfa: models.Account{
				ID:      swag.String("acct2-id"),
				Deleted: swag.Bool(false),
				// "2016-02-03T01:30:11Z"
				Created: created2,
				Metadata: models.DynamicMetadata{
					"quayID":          "acct2-quay-id",
					"newsletterEmail": false,
				},
				Profile: &models.Profile{
					ID:          swag.String("prof2-id"),
					AccountID:   swag.String("acct2-id"),
					CompanyName: "Foo Corp",
					Email:       swag.String("foo@fooinc.com"),
					FirstName:   swag.String("Foo"),
					LastName:    swag.String("Bar"),
					Landline:    "555-123-4567",
					Mobile:      "555-098-7654",
				},
			},
			pba: pb.Account{
				ID:              "acct2-id",
				QuayID:          "acct2-quay-id",
				NewsletterEmail: false,
				Deleted:         false,
				// "2016-02-03T01:30:11Z"
				CreatedAt: &pbc.Timestamp{
					Seconds: 1454463011,
					Nanos:   0,
				},
				Profile: &pb.Profile{
					ID:          "prof2-id",
					AccountID:   "acct2-id",
					CompanyName: "Foo Corp",
					Email:       "foo@fooinc.com",
					FirstName:   "Foo",
					LastName:    "Bar",
					Landline:    "555-123-4567",
					Mobile:      "555-098-7654",
				},
			},
		},
	}

	for i, tt := range tests {
		got := convertBFAccount(&tt.bfa)
		if diff := pretty.Compare(tt.pba, *got); diff != "" {
			t.Errorf("case %d: Compare(want, got) = %v", i, diff)
		}
	}
}

func TestSubscriptionStateDescriptionInvalidDate(t *testing.T) {
	sub := &pb.Subscription{State: pb.SubscriptionState_Paid, Type: pb.Subscription_Trial, TrialEnd: &pbc.Timestamp{Seconds: 5, Nanos: 3}}
	sv, txt := subscriptionStateDescription(sub)
	if sv != pb.StateSeverity_GOOD {
		t.Fatalf("Expected OK state, got %v", sv)
	}
	if txt != "Trial" {
		t.Fatalf("Expected 'Trial', got: %s", txt)
	}
}
