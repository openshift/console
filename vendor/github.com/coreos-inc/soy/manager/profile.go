package manager

import (
	"fmt"

	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/client/profiles"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/common/serrors"
	pb "github.com/coreos-inc/soy/proto"
)

// Profile represents a profile service, providing access to profiles.
type Profile interface {
	Get(string) (*pb.Profile, error)
}

type profile struct {
	bfClient *client.BillForward
}

func (p profile) Get(id string) (*pb.Profile, error) {
	profOK, err := p.bfClient.Profiles.GetProfile(&profiles.GetProfileParams{
		ProfileID: id,
	})
	if err != nil {
		if getFailed, ok := err.(*profiles.GetProfileDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to get profile")
	}
	if len(profOK.Payload.Results) == 0 {
		err = fmt.Errorf("No profile with ID %s", id)
		return nil, serrors.Errorf(serrors.NotFound, err, "No profile information found.")
	}
	bfprof := profOK.Payload.Results[0]

	var pbprof pb.Profile
	if err = Map(bfprof, &pbprof); err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to convert API response")
	}
	return &pbprof, nil
}
