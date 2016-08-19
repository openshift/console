package pubsub

import (
	"errors"
	"fmt"

	"github.com/Sirupsen/logrus"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/client"
	"github.com/aws/aws-sdk-go/service/sqs"
	"golang.org/x/net/context"
)

var (
	logger        = logrus.WithField("package", "pubsub")
	ErrNoMessages = errors.New("no messages in queue")
)

type Channel string

type AWSQueueConfig map[Channel]string

func (cfg AWSQueueConfig) ToQueueURL(c Channel) string {
	if queueURL, ok := cfg[c]; ok {
		return queueURL
	}
	panic(fmt.Sprintf("invalid channel: %s", c))
}

func (cfg AWSQueueConfig) QueueURLExists(c Channel) bool {
	_, ok := cfg[c]
	return ok
}

func (cfg AWSQueueConfig) SetQueueURL(c Channel, queueURL string) {
	cfg[c] = queueURL
}

type Message struct {
	MessageID string
	AckID     string
	Data      []byte
	Attempts  int64
}

type Subscriber interface {
	Pull(Channel, int64) ([]*Message, error)
	Acknowledge(Channel, string) error
}

type PullWaiter interface {
	PullWait(context.Context, Channel, int64) ([]*Message, error)
}

type AWSSQSSubscriber struct {
	SQS                  *sqs.SQS
	WaitTimeSec          int64
	VisibilityTimeoutSec int64
	QueueConfig          AWSQueueConfig
}

func NewAWSSQSSubscriber(cfg client.ConfigProvider, queueCfg AWSQueueConfig, waitTime, visibilityTimeout int64) *AWSSQSSubscriber {
	return &AWSSQSSubscriber{
		SQS:                  sqs.New(cfg),
		QueueConfig:          queueCfg,
		WaitTimeSec:          waitTime,
		VisibilityTimeoutSec: visibilityTimeout,
	}
}

func (s *AWSSQSSubscriber) Pull(c Channel, maxMsgs int64) ([]*Message, error) {
	msgs, err := retrieveFromSQS(s.SQS, s.QueueConfig.ToQueueURL(c), s.WaitTimeSec, s.VisibilityTimeoutSec, maxMsgs)
	if err != nil {
		return nil, err
	}
	newMsgs := make([]*Message, 0, len(msgs))
	for _, msg := range msgs {
		newMsgs = append(newMsgs, &Message{
			MessageID: aws.StringValue(msg.MessageId),
			AckID:     aws.StringValue(msg.ReceiptHandle),
			Data:      []byte(aws.StringValue(msg.Body)),
		})
	}
	return newMsgs, nil
}

func (s *AWSSQSSubscriber) Acknowledge(c Channel, ackID string) error {
	return deleteFromSQS(s.SQS, s.QueueConfig.ToQueueURL(c), ackID)
}

func retrieveFromSQS(sqsClient *sqs.SQS, queueURL string, waitTime, visiblityTimeout, maxMsgs int64) ([]*sqs.Message, error) {
	logger.WithField("queueURL", queueURL).Debug("attempting to retrieve message from SQS")
	var maxMsgsPtr *int64
	if maxMsgs > 0 && maxMsgs <= 10 {
		maxMsgsPtr = &maxMsgs
	}
	if visiblityTimeout <= 0 {
		// SQS Default
		visiblityTimeout = 30
	}
	resp, err := sqsClient.ReceiveMessage(&sqs.ReceiveMessageInput{
		MaxNumberOfMessages: maxMsgsPtr,
		QueueUrl:            aws.String(queueURL),
		WaitTimeSeconds:     aws.Int64(waitTime),
		VisibilityTimeout:   aws.Int64(visiblityTimeout),
	})
	if err != nil {
		return nil, err
	}
	return resp.Messages, nil
}

func deleteFromSQS(sqsClient *sqs.SQS, queueURL string, receiptHandle string) error {
	_, err := sqsClient.DeleteMessage(&sqs.DeleteMessageInput{
		QueueUrl:      aws.String(queueURL),
		ReceiptHandle: aws.String(receiptHandle),
	})
	return err
}

func PullWait(ctx context.Context, sub Subscriber, channel Channel, maxMsgs int64) ([]*Message, error) {
	if maxMsgs == 0 {
		maxMsgs = 1
	}
	// If the subscriber knows how to pull wait, use it's implementation
	if pw, ok := sub.(PullWaiter); ok {
		return pw.PullWait(ctx, channel, maxMsgs)
	}
	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		msgs, err := sub.Pull(channel, maxMsgs)
		if err != nil {
			return nil, err
		}
		if len(msgs) == 0 {
			continue
		}
		return msgs, nil
	}
}
