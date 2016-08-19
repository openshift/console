package manager

import (
	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/client/invoices"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/swag"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/common/serrors"
	pb "github.com/coreos-inc/soy/proto"
)

// Invoice represents an invoice service that provides access to invoices.
type Invoice interface {
	Get(invoiceID string) (*pb.Invoice, error)
	GetAsPDF(invoiceID string) (*runtime.File, error)
	ListByAccountID(string) ([]*pb.Invoice, error)
	AnyUnpaidForAccount(accountID string) (bool, error)
}

type invoice struct {
	bfClient *client.BillForward
}

func (inv invoice) Get(invoiceID string) (*pb.Invoice, error) {
	invoiceResp, err := inv.bfClient.Invoices.GetInvoiceByID(&invoices.GetInvoiceByIDParams{
		InvoiceID: invoiceID,
	})
	if err != nil {
		if getFailed, ok := err.(*invoices.GetInvoiceByIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to retrieve invoice.")
	}

	if len(invoiceResp.Payload.Results) != 1 {
		return nil, serrors.Errorf(serrors.NotFound, nil, "Invoice not found.")
	}

	var invoice pb.Invoice
	err = Map(invoiceResp.Payload.Results[0], &invoice)
	if err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to retrieve invoice.")
	}
	return &invoice, nil
}

func (inv invoice) GetAsPDF(invoiceID string) (*runtime.File, error) {
	invoicePDFResp, err := inv.bfClient.Invoices.GetInvoiceAsPDF(&invoices.GetInvoiceAsPDFParams{
		ID:               invoiceID,
		IncludeFooter:    swag.Bool(false),
		GroupLineItemsBy: swag.String("Product"),
	})
	if err != nil {
		if getFailed, ok := err.(*invoices.GetInvoiceAsPDFDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to retrieve invoice as pdf.")
	}
	return &invoicePDFResp.Payload, nil
}

func (inv invoice) ListByAccountID(accountID string) ([]*pb.Invoice, error) {
	invoicesResp, err := inv.bfClient.Invoices.GetInvoicesByAccountID(&invoices.GetInvoicesByAccountIDParams{
		AccountID:       accountID,
		ExcludeChildren: swag.Bool(true),
	})
	if err != nil {
		if getFailed, ok := err.(*invoices.GetInvoicesByAccountIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to list invoices for account.")
	}

	pbInvoices := make([]*pb.Invoice, len(invoicesResp.Payload.Results))
	for i, invoice := range invoicesResp.Payload.Results {
		err := Map(invoice, &pbInvoices[i])
		if err != nil {
			return nil, serrors.Errorf(serrors.Internal, err, "Unable to list invoices for account.")
		}
	}
	return pbInvoices, nil
}

// AnyUnpaidForAccount returns whether there are any unpaid invoices for the
// given account.
func (inv invoice) AnyUnpaidForAccount(accountID string) (bool, error) {
	invs, err := inv.ListByAccountID(accountID)
	if err != nil {
		return false, serrors.Errorf(serrors.Internal, err, "Unable to determine invoice status, please try again later.")
	}
	for _, inv := range invs {
		if remainingBalanceForInvoice(inv) > 0 {
			return true, nil
		}
	}
	return false, nil
}

func remainingBalanceForInvoice(inv *pb.Invoice) float64 {
	// Check if the invoice has been partially paid, if so deduct that amount.
	// InvoiceCost does not reflect any amount paid, so calculation must be done
	// on our end.
	return inv.InvoiceCost - inv.InvoicePaid
}
