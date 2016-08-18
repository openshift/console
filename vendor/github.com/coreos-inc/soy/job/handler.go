package job

import (
	"github.com/coreos-inc/soy/common/pubsub"
)

type Handler interface {
	HandleJob(*pubsub.Message) error
}
