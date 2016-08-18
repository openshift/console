package manager

import (
	"errors"

	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/client/product_rate_plans"
	"github.com/authclub/billforward/client/products"
	"github.com/go-openapi/swag"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	pb "github.com/coreos-inc/soy/proto"
)

// Product represents a product service, providing access to products.
type Product interface {
	List(db.Queryer, bool, bool) ([]*pb.Product, error)
}

type product struct {
	bfClient *client.BillForward
}

func (p product) List(_ db.Queryer, includeDeleted, includePrivate bool) ([]*pb.Product, error) {
	productsResp, err := p.bfClient.Products.GetAllProducts(&products.GetAllProductsParams{
		IncludeRetired: swag.Bool(includeDeleted),
		OrderBy:        swag.String("created"),
		Records:        swag.Int32(100),
	})
	if err != nil {
		if getFailed, ok := err.(*products.GetAllProductsDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error listing products.")
	}
	if len(productsResp.Payload.Results) == 0 {
		err = errors.New("List Products: no products returned from BF API")
		return nil, serrors.Errorf(serrors.Internal, err, "Error listing products.")
	}

	plansResp, err := p.bfClient.ProductRatePlans.GetAllRatePlans(&product_rate_plans.GetAllRatePlansParams{
		OrderBy: swag.String("name"),
		Records: swag.Int32(100),
	})
	if err != nil {
		if getFailed, ok := err.(*product_rate_plans.GetAllRatePlansDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to get all rate plans")
	}
	if len(plansResp.Payload.Results) == 0 {
		err = errors.New("List Products: no rate plans returned from BF API")
		return nil, serrors.Errorf(serrors.Internal, err, "Error listing products.")
	}

	productToPlan := make(map[string][]*pb.RatePlan)
	for _, bfPlan := range plansResp.Payload.Results {
		var plan pb.RatePlan
		if err := Map(bfPlan, &plan); err != nil {
			return nil, serrors.Errorf(serrors.Internal, err, "Error listing products.")
		}
		convertRatePlanMetadata(bfPlan.Metadata, &plan)
		if !includePrivate {
			// Do not return non-public rate plans.
			if !plan.Public {
				continue
			}
		}
		productToPlan[plan.ProductID] = append(productToPlan[plan.ProductID], &plan)
	}

	var results []*pb.Product
	for _, bfp := range productsResp.Payload.Results {
		var prod pb.Product
		if err := Map(bfp, &prod); err != nil {
			return nil, serrors.Errorf(serrors.Internal, err, "Error listing products.")
		}
		convertProductMetadata(bfp.Metadata, &prod)
		// Do not return non-public products.
		if !includePrivate && !prod.Public {
			continue
		}
		prod.RatePlans = productToPlan[prod.ID]
		results = append(results, &prod)
	}

	return results, nil
}
