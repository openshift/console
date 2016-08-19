package common

import "github.com/pborman/uuid"

type IDGenerator func() (string, error)

func DefaultIDGenerator() (string, error) {
	return uuid.New(), nil
}
