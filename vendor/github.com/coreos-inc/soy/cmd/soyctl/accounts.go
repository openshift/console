package main

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	pb "github.com/coreos-inc/soy/proto"
)

var (
	accountsCmd = &cobra.Command{
		Use:   "accounts [command]",
		Short: "Account management",
	}
	listAccountsCmd = &cobra.Command{
		Use:   "list",
		Short: "List accounts",
		Run:   listAccounts,
	}
	getAccountCmd = &cobra.Command{
		Use:   "get [accountID]",
		Short: "Get all account details",
		Run:   getAccount,
	}
	createAccountCmd = &cobra.Command{
		Use:   "create",
		Short: "Create a new account",
		Long: `
		Create a new account

		For example:

		soyctl --dex-id=123 accounts create -f account.json

		Where account.json contains something like:
		{
		    "profile": {
		      "companyName": "n.a",
		      "email": "n.a",
		      "firstName": "n.a",
		      "lastName": "n.a",
		      "landline": "",
		      "mobile": "",
		      "addresses": []
		    }
		}
		`,
		Run: createAccount,
	}
	retireAccountCmd = &cobra.Command{
		Use:   "retire [accountID]",
		Short: "Retire an account",
		Run:   retireAccount,
	}
	terminateAccountCmd = &cobra.Command{
		Use:   "terminate [accountID]",
		Short: "Terminate an account",
		Run:   terminateAccount,
	}
	upsertAccountCmd = &cobra.Command{
		Use:   "upsert",
		Short: "Upsert a account",
		Run:   upsertAccount,
	}
	accountStatusCmd = &cobra.Command{
		Use:   "status [accountID]",
		Short: "Get status for an account",
		Run:   accountStatus,
	}
	accountAdvanceCmd = &cobra.Command{
		Use:   "advance [accountID]",
		Short: "Advance all subscriptions for an account by a specified number of billing periods.",
		Run:   accountAdvance,
	}

	updateProfileCmd = &cobra.Command{
		Use:   "update-profile",
		Short: "Update profile",
		Long: `
		Update profile

		For example:

		soyctl --dex-id=123 accounts update-profile -f profile.json

		Where profile.json contains something like:
		{
		      "metadata": {},
		      "id": "n.a",
		      "accountID": "n.a",
		      "companyName": "n.a",
		      "email": "n.a",
		      "firstName": "n.a",
		      "lastName": "n.a",
		      "landline": "",
		      "mobile": "",
		      "addresses": []
		}
		`,
		Run: updateProfile,
	}

	revokeAccessCmd = &cobra.Command{
		Use:   "revoke-access [accountID]",
		Short: "Revokes access to an account",
		Run:   revokeAccountAcess,
	}

	changeRoleCmd = &cobra.Command{
		Use:   "change-role [dexID] [accountID] [role]",
		Short: "Changes role for a user on an account",
		Run:   changeRole,
	}

	createAddressCmd = &cobra.Command{
		Use:   "create-address",
		Short: "Create an address for a profile",
		Long: `
		Create an address for a profile

		For example:

		soyctl --dex-id=123 accounts create-address -f address.json

		Where address.json contains something like:
		{
		    "addressLine1": "123 place ct",
		    "addressLine2": "",
		    "addressLine3": "",
		    "city": "Chicago",
		    "province": "IL",
		    "country": "US",
		    "postcode": "60606",
		    "landline": "",
		    "profileID": "",
		    "primaryAddress": false
		}
		`,
		Run: createAddress,
	}

	updateAddressCmd = &cobra.Command{
		Use:   "update-address",
		Short: "Update an address for a profile (see create-address for example json file)",
		Run:   updateAddress,
	}

	convertExternallyCreatedAccountCmd = &cobra.Command{
		Use:   "convert-externally-created [dexID] [email]",
		Short: "Convert an externally created account into a user account",
		Run:   convertExternallyCreatedAccount,
	}

	getAccountAssetsCmd = &cobra.Command{
		Use:   "assets [accountID]",
		Short: "Returns all of the assets for this account",
		Run:   getAccountAssets,
	}

	newLicenseCmd = &cobra.Command{
		Use:   "new-license [accountID]",
		Short: "Create a new license for this account",
		Run:   newLicense,
	}
)

func init() {
	// Set up flags for `accounts list`.
	listAccountsCmd.Flags().Bool("include-retired", false, "Include accounts that have been retired.")

	// Set up flags for `accounts advance`.
	accountAdvanceCmd.Flags().Int32P("periods", "p", 0, "Number of periods to advance subscriptions for account.")

	// Set up flags for `accounts revoke-access`.
	revokeAccessCmd.Flags().String("member-dex-user-id", "", "Dex ID of a user already associated with an account.")
	revokeAccessCmd.Flags().String("invited-user-email", "", "Email address of an invited user.")

	createAccountCmd.Flags().StringP("file", "f", "", "JSON file with create account params")
	upsertAccountCmd.Flags().StringP("file", "f", "", "JSON file with create account params")
	createAddressCmd.Flags().StringP("file", "f", "", "JSON file with create address params")
	updateAddressCmd.Flags().StringP("file", "f", "", "JSON file with update address params")
	updateProfileCmd.Flags().StringP("file", "f", "", "JSON file with update profile params")

	accountsCmd.AddCommand(listAccountsCmd)
	accountsCmd.AddCommand(getAccountCmd)
	accountsCmd.AddCommand(createAccountCmd)
	accountsCmd.AddCommand(retireAccountCmd)
	accountsCmd.AddCommand(terminateAccountCmd)
	accountsCmd.AddCommand(upsertAccountCmd)
	accountsCmd.AddCommand(updateProfileCmd)
	accountsCmd.AddCommand(createAddressCmd)
	accountsCmd.AddCommand(updateAddressCmd)
	accountsCmd.AddCommand(accountStatusCmd)
	accountsCmd.AddCommand(accountAdvanceCmd)
	accountsCmd.AddCommand(revokeAccessCmd)
	accountsCmd.AddCommand(newLicenseCmd)

	roles := make([]string, 0, len(pb.Role_name))
	for _, role := range pb.Role_name {
		roles = append(roles, role)
	}
	changeRoleCmd.Long = fmt.Sprintf("Acceptable roles are: %s", strings.Join(roles, ", "))
	accountsCmd.AddCommand(changeRoleCmd)
	accountsCmd.AddCommand(convertExternallyCreatedAccountCmd)
	accountsCmd.AddCommand(getAccountAssetsCmd)

	rootCmd.AddCommand(accountsCmd)
}

func listAccounts(cmd *cobra.Command, args []string) {
	mustPPJSON(asvc.ListAccounts(ctx, &pb.ListAccountsReq{}))
}

func getAccount(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		cmd.Usage()
		plog.Fatal("accountID must be provided")
	}
	mustPPJSON(asvc.GetAccount(ctx, &pb.GetAccountReq{
		AccountID: args[0],
	}))
}

func createAccount(cmd *cobra.Command, args []string) {
	fs := cmd.Flags()
	f, err := fs.GetString("file")
	if err != nil {
		plog.Fatal(err)
	}
	var acct pb.Account
	parseParamsFromJSONFile(f, &acct)
	mustPPJSON(asvc.CreateAccount(ctx, &pb.CreateAccountReq{
		Account: &acct,
	}))
}

func upsertAccount(cmd *cobra.Command, args []string) {
	fs := cmd.Flags()
	f, err := fs.GetString("file")
	if err != nil {
		plog.Fatal(err)
	}
	var acct pb.Account
	parseParamsFromJSONFile(f, &acct)
	mustPPJSON(asvc.UpsertAccount(ctx, &pb.UpsertAccountReq{
		Account: &acct,
	}))
}

func retireAccount(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID.")
	}
	mustPPJSON(asvc.RetireAccount(ctx, &pb.RetireAccountReq{
		AccountID: args[0],
	}))
}

func terminateAccount(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID.")
	}
	mustPPJSON(asvc.TerminateAccount(ctx, &pb.TerminateAccountReq{
		AccountID: args[0],
	}))
}

func updateProfile(cmd *cobra.Command, args []string) {
	fs := cmd.Flags()
	f, err := fs.GetString("file")
	if err != nil {
		plog.Fatal(err)
	}

	var prof pb.Profile
	parseParamsFromJSONFile(f, &prof)

	mustPPJSON(asvc.UpdateProfile(ctx, &pb.UpdateProfileReq{Profile: &prof}))
}

func createAddress(cmd *cobra.Command, args []string) {
	fs := cmd.Flags()
	f, err := fs.GetString("file")
	if err != nil {
		plog.Fatal(err)
	}

	var addr pb.Address
	parseParamsFromJSONFile(f, &addr)

	mustPPJSON(asvc.CreateAddress(ctx, &pb.CreateAddressReq{Address: &addr}))
}

func updateAddress(cmd *cobra.Command, args []string) {
	fs := cmd.Flags()
	f, err := fs.GetString("file")
	if err != nil {
		plog.Fatal(err)
	}

	var addr pb.Address
	parseParamsFromJSONFile(f, &addr)
	mustPPJSON(asvc.UpdateAddress(ctx, &pb.UpdateAddressReq{Address: &addr}))
}

func revokeAccountAcess(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the Account ID")
	}
	fs := cmd.Flags()
	memberDexID, err := fs.GetString("member-dex-user-id")
	if err != nil {
		plog.Fatal(err)
	}
	invitedEmail, err := fs.GetString("invited-user-email")
	if err != nil {
		plog.Fatal(err)
	}
	_, err = asvc.RevokeUserAccountAccess(ctx, &pb.RevokeUserAccountAccessReq{ExistingMemberDexID: memberDexID, InvitedUserEmail: invitedEmail, AccountID: args[0]})
	if err != nil {
		plog.Fatal(err)
	}
}

func changeRole(cmd *cobra.Command, args []string) {
	if len(args) != 3 {
		plog.Fatal("You must provide DexID, BF Account ID and role parameters")
	}
	role := pb.Role(pb.Role_value[args[2]])
	_, err := asvc.ChangeUserRole(ctx, &pb.ChangeUserRoleReq{DexID: args[0], AccountID: args[1], Role: role})
	if err != nil {
		plog.Fatal(err)
	}
}

func accountStatus(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID.")
	}
	mustPPJSON(asvc.GetAccountStatus(ctx, &pb.GetAccountStatusReq{AccountID: args[0]}))
}

func accountAdvance(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID.")
	}
	periods, err := cmd.Flags().GetInt32("periods")
	if err != nil {
		plog.Fatalf("Could not get 'periods' flag: %v", err)
	}
	_, err = asvc.AdvanceAccount(ctx, &pb.AdvanceAccountReq{
		AccountID: args[0],
		Periods:   int32(periods),
	})
	if err != nil {
		plog.WithError(err).Fatal("Could not advance account subscriptions")
	}
}

func convertExternallyCreatedAccount(cmd *cobra.Command, args []string) {
	if len(args) != 2 {
		plog.Fatal("must provide dexID and email address")
	}
	mustPPJSON(asvc.ConvertExternallyCreatedAccounts(ctx, &pb.ConvertExternallyCreatedAccountsReq{
		DexID: args[0],
		Email: args[1],
	}))
}

func getAccountAssets(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID.")
	}
	mustPPJSON(asvc.GetAssets(ctx, &pb.GetAssetsReq{AccountID: args[0]}))
}

func newLicense(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the account ID.")
	}
	mustPPJSON(asvc.CreateLicense(ctx, &pb.CreateLicenseReq{AccountID: args[0]}))
}
