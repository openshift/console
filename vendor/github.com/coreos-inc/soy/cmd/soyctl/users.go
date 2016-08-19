package main

import (
	pb "github.com/coreos-inc/soy/proto"

	"github.com/spf13/cobra"
)

var (
	usersCmd = &cobra.Command{
		Use:   "users [command]",
		Short: "User management",
	}
	createUserCmd = &cobra.Command{
		Use:   "create [dex-id] [email]",
		Short: "Create user",
		Run:   createUser,
	}
	getUserCmd = &cobra.Command{
		Use:   "get [dex-id]",
		Short: "Get user by Dex ID",
		Run:   getUser,
	}
	inviteUserCmd = &cobra.Command{
		Use:   "invite [email] [BF Account ID] [role]",
		Short: "Invite user",
		Run:   inviteUser,
	}
	acceptInviteCmd = &cobra.Command{
		Use:   "accept-invite [BF Account ID]",
		Short: "Accept invite",
		Run:   acceptInvite,
	}
)

func init() {
	usersCmd.AddCommand(createUserCmd)
	usersCmd.AddCommand(inviteUserCmd)
	usersCmd.AddCommand(acceptInviteCmd)
	usersCmd.AddCommand(getUserCmd)

	rootCmd.AddCommand(usersCmd)
}

func createUser(cmd *cobra.Command, args []string) {
	if len(args) != 2 {
		plog.Fatal("You must include both Dex ID and email, in that order")
	}
	_, err := asvc.CreateUser(ctx, &pb.CreateUserReq{DexID: args[0], Email: args[1]})
	if err != nil {
		plog.Fatal(err)
	}
}

func getUser(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the Dex ID of the user to get")
	}
	mustPPJSON(asvc.GetUser(ctx, &pb.GetUserReq{DexID: args[0]}))
}

func inviteUser(cmd *cobra.Command, args []string) {
	if len(args) != 3 {
		plog.Fatal("You must provide the email, BF Account ID and Role in that order")
	}
	_, err := asvc.InviteUser(ctx, &pb.InviteUserReq{Email: args[0], AccountID: args[1], Role: pb.Role(pb.Role_value[args[2]])})
	if err != nil {
		plog.Fatal(err)
	}
}

func acceptInvite(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		plog.Fatal("You must provide the BF Account ID")
	}
	_, err := asvc.AcceptUserInvitation(ctx, &pb.AcceptUserInvitationReq{AccountID: args[0]})
	if err != nil {
		plog.Fatal(err)
	}
}
