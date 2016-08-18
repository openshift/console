package server

import (
	"strconv"

	"golang.org/x/net/context"
	"google.golang.org/grpc/metadata"

	"github.com/coreos-inc/soy/common/serrors"
)

type accessType string

const (
	// ReadOnly represents a READ_ONLY access type.
	ReadOnly accessType = "READ_ONLY"
	// Modify represents a MODIFY access type.
	Modify accessType = "MODIFY"

	// AuthDexKey is the key used in the grpc metadata that holds the
	// Dex ID of the user making the request.
	// NOTE: any keys used in grpc metadata must be lowercase
	AuthDexKey = "dexid"
	// SkipAuthKey is the key used in the grpc metadata to check whether or not
	// we need to any auth checks. If it is empty or false, we assume we should
	// do an auth check, otherwise if it's true we skip the check.
	SkipAuthKey = "skipauth"
)

func authMetaFromContext(ctx context.Context) (dexID string, err error) {
	md, ok := metadata.FromContext(ctx)
	if !ok {
		err = serrors.Errorf(serrors.Validation, nil, "No metadata found in request context.")
		return
	}
	for k, v := range md {
		sk, sv, derr := metadata.DecodeKeyValue(k, v[0])
		if derr != nil {
			err = serrors.Errorf(serrors.Internal, nil, "Error decoding request metadata: %v", err)
			return
		}
		if sk == AuthDexKey {
			dexID = sv
			return
		}
	}
	err = serrors.Errorf(serrors.Validation, nil, "No metadata found in request context.")
	return
}

func needsAuthCheck(ctx context.Context) (bool, error) {
	if md, ok := metadata.FromContext(ctx); ok {
		v, ok := md[SkipAuthKey]
		if !ok {
			return true, nil
		}
		_, sv, err := metadata.DecodeKeyValue(SkipAuthKey, v[0])
		if err != nil {
			return true, err
		}
		skip, err := strconv.ParseBool(sv)
		if err != nil {
			return true, err
		}
		return !skip, nil
	}
	return true, nil
}
