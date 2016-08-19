package main

import (
	pb "github.com/coreos-inc/soy/proto"
	"github.com/spf13/cobra"
)

var (
	subscriptionsCmd = &cobra.Command{
		Use:   "subscriptions [command]",
		Short: "Subscription management",
	}
	createSubscriptionCmd = &cobra.Command{
		Use:   "create",
		Short: "Create subscription",
		Long: `Create a subscription. Take a --file flag which should contain JSON representing the CreateSubscriptionRequest to be executed, e.g.:
		{
			"accountID": "ACC-49E48BF4-2B6B-4934-8C73-DDA7129B",
			"productID": "PRO-xxx-123",
			"productRatePlanID": "PRP-B199CAF9-1DAD-4249-A3F9-55C071F4",
			"agreedTOS" true,
			"state": 1,
			"paymentType": 0,
			"pricingComponentQuantities": [
				{
					"pricingComponent": "PCO-0DBC0BAB-B836-4A72-963D-D4E2E8CF",
					"quantity": 1
				},
				{
					"pricingComponent": "PCO-8BEC328A-2342-4442-8BC8-41BF0F2A",
					"quantity": 1
				},
				{
					"pricingComponent": "PCO-9C02AD6E-60B5-4622-A860-1454D2C5",
					"quantity": 0
				},
				{
					"pricingComponent": "PCO-DBD03F88-AAC8-43AE-833F-00CD179B",
					"quantity": 1
				}
			]
		}
		`,
		Run: createSubscription,
	}
	cancelSubscriptionCmd = &cobra.Command{
		Use:   "cancel [subscription id]",
		Short: "Cancel subscription",
		Long: `Cancel a subscription.
State must be one of the following values: Pending, Completed, Cancelled or Voided.

Source is the source of the cancellation.
`,
		Run: cancelSubscription,
	}
	listSubscriptionsCmd = &cobra.Command{
		Use:   "list [accountID]",
		Short: "List all subscriptions for an account.",
		Run:   listSubscriptions,
	}
)

func init() {
	createSubscriptionCmd.Flags().StringP(`file`, "f", "", "JSON file with create subscription params")
	subscriptionsCmd.AddCommand(createSubscriptionCmd)
	subscriptionsCmd.AddCommand(cancelSubscriptionCmd)
	listSubscriptionsCmd.Flags().Bool("include-retired", false, "Include retired subscriptions in response")
	subscriptionsCmd.AddCommand(listSubscriptionsCmd)
	rootCmd.AddCommand(subscriptionsCmd)
}

func createSubscription(cmd *cobra.Command, args []string) {
	fs := cmd.Flags()
	f, err := fs.GetString("file")
	if err != nil {
		plog.Fatalf("Error getting 'file' flag: %v,", err)
	}
	if f == "" {
		plog.Fatal("You must provide the --file flag")
	}
	var subReq pb.CreateSubscriptionReq
	parseParamsFromJSONFile(f, &subReq)
	mustPPJSON(asvc.CreateSubscription(ctx, &subReq))
}

func cancelSubscription(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the Subscription ID")
	}
	req := pb.CancelSubscriptionReq{
		SubscriptionID: args[0],
	}
	_, err := asvc.CancelSubscription(ctx, &req)
	if err != nil {
		plog.Fatal(err)
	}
}

func listSubscriptions(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID")
	}
	fs := cmd.Flags()
	var includeRetired bool
	f, err := fs.GetBool("include-retired")
	if err != nil {
		includeRetired = f
	}

	mustPPJSON(asvc.ListSubscriptions(ctx, &pb.ListSubscriptionsReq{AccountID: args[0], IncludeRetired: includeRetired}))
}
