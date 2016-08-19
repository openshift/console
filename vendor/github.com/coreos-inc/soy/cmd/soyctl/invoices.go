package main

import (
	"fmt"
	"io/ioutil"
	"log"

	"github.com/spf13/cobra"

	pb "github.com/coreos-inc/soy/proto"
)

var (
	invoicesCmd = &cobra.Command{
		Use:   "invoices [command]",
		Short: "Product/Rate-Plan management",
	}
	getInvoiceAsPDFCmd = &cobra.Command{
		Use:   "get-pdf [invoiceID]",
		Short: "Get an invoice as a pdf",
		Run:   getInvoiceAsPDF,
	}
	listInvoicesCmd = &cobra.Command{
		Use:   "list [accountID]",
		Short: "Get a list of invoices for a given account",
		Run:   listInvoices,
	}
)

func init() {
	getInvoiceAsPDFCmd.Flags().StringP("file", "f", "invoice.pdf", "Save the invoice to a file rather than printing to stdout")

	invoicesCmd.AddCommand(listInvoicesCmd)
	invoicesCmd.AddCommand(getInvoiceAsPDFCmd)

	rootCmd.AddCommand(invoicesCmd)
}

func getInvoiceAsPDF(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		log.Fatal("must provide invoiceID")
	}
	file, err := cmd.Flags().GetString("file")
	if err != nil {
		plog.Fatal(err)
	}

	resp, err := asvc.GetInvoiceAsPDF(ctx, &pb.GetInvoiceAsPDFReq{
		InvoiceID: args[0],
	})
	if err != nil {
		plog.Fatal(err)
	}

	if file != "" {
		err := ioutil.WriteFile(file, resp.InvoiceData, 0644)
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("successfully saved invoice to %s", file)
	} else {
		fmt.Print(resp.InvoiceData)
	}
}

func listInvoices(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		log.Fatal("must provide accountID")
	}

	mustPPJSON(asvc.ListInvoices(ctx, &pb.ListInvoicesReq{
		AccountID: args[0],
	}))
}
