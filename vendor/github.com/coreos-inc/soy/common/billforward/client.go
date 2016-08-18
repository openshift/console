package billforward

import (
	"errors"
	"fmt"

	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/models"
	httpclient "github.com/go-openapi/runtime/client"
)

type Config struct {
	BillforwardToken    string
	BillforwardEndpoint string
}

func NewClient(cfg Config) *client.BillForward {
	transport := httpclient.New(cfg.BillforwardEndpoint, "/v1", []string{"https"})
	transport.DefaultAuthentication = httpclient.BearerToken(cfg.BillforwardToken)
	transport.Consumers["application/pdf"] = PDFConsumer
	return client.New(transport, nil)
}

func FormatError(bfErr *models.BFError) error {
	if bfErr == nil {
		return errors.New("BFError had no payload")
	}
	return fmt.Errorf("BFError occurred, ErrorType: '%s', Message: '%s', Parameters: '%q'", bfErr.ErrorType, bfErr.ErrorMessage, bfErr.ErrorParameters)
}
