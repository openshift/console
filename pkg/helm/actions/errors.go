package actions

import "errors"

var (
	ErrReleaseNotFound         = errors.New("release: not found")
	ErrReleaseRevisionNotFound = errors.New("revision not found for provided release")
)
