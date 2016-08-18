package main

import (
	"github.com/spf13/cobra"

	pb "github.com/coreos-inc/soy/proto"
)

var (
	productsCmd = &cobra.Command{
		Use:   "products [command]",
		Short: "Product/Rate-Plan management",
	}
	listProductsCmd = &cobra.Command{
		Use:   "list",
		Short: "List products",
		Run:   listProducts,
	}
)

func init() {
	rootCmd.AddCommand(productsCmd)

	listProductsCmd.Flags().Bool("include-deleted", false, "Include products that have been deleted.")
	listProductsCmd.Flags().Bool("include-private", false, "Include private products.")

	productsCmd.AddCommand(listProductsCmd)
}

func listProducts(cmd *cobra.Command, args []string) {
	includeDeleted, err := cmd.Flags().GetBool("include-deleted")
	if err != nil {
		plog.Fatal(err)
	}
	includePrivate, err := cmd.Flags().GetBool("include-private")
	if err != nil {
		plog.Fatal(err)
	}
	mustPPJSON(asvc.ListProducts(ctx, &pb.ListProductsReq{
		IncludeDeleted: includeDeleted,
		IncludePrivate: includePrivate,
	}))
}
