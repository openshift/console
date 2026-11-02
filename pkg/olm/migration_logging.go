package olm

import (
	"context"
	"errors"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
)

// migrationErrorCategory returns a fixed log label without serializing error messages or wrapped request data.
func migrationErrorCategory(err error) string {
	switch {
	case errors.Is(err, context.Canceled):
		return "cancelled"
	case errors.Is(err, context.DeadlineExceeded), apierrors.IsTimeout(err):
		return "timeout"
	case apierrors.IsUnauthorized(err):
		return "unauthorized"
	case apierrors.IsForbidden(err):
		return "forbidden"
	case apierrors.IsNotFound(err):
		return "not-found"
	case apierrors.IsConflict(err):
		return "conflict"
	default:
		return "unexpected"
	}
}
