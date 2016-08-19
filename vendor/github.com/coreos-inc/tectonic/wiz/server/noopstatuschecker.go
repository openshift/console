package server

import (
	"github.com/Sirupsen/logrus"
)

type noopStatusChecker struct {
	logger *logrus.Entry
}

func NewNoopStatusChecker(logger *logrus.Entry) *noopStatusChecker {
	return &noopStatusChecker{
		logger: logger,
	}
}

func (k *noopStatusChecker) Check() error {
	return nil
}
