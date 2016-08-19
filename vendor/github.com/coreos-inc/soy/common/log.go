package common

import "github.com/Sirupsen/logrus"

type AWSLogger struct {
	*logrus.Entry
}

func (l *AWSLogger) Log(args ...interface{}) {
	l.Debug(args...)
}
