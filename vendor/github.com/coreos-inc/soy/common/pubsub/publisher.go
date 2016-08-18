package pubsub

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/client"
	"github.com/aws/aws-sdk-go/service/sns"
)

var jsonMessageStructure = aws.String("json")

type Topic string

type Publisher interface {
	Publish(topic Topic, message string) (string, error)
}

type TopicConfig map[Topic]string

func (cfg TopicConfig) ToARN(topic Topic) string {
	if arn, ok := cfg[topic]; ok {
		return arn
	}
	panic(fmt.Sprintf("invalid topic: %s", topic))
}

type AWSSNSPublisher struct {
	SNS         *sns.SNS
	TopicConfig TopicConfig
}

func NewAWSSNSPublisher(cfg client.ConfigProvider, topicConfig TopicConfig) *AWSSNSPublisher {
	return &AWSSNSPublisher{
		SNS:         sns.New(cfg),
		TopicConfig: topicConfig,
	}
}

func (p *AWSSNSPublisher) Publish(topic Topic, message string) (string, error) {
	resp, err := p.SNS.Publish(&sns.PublishInput{
		TopicArn:         aws.String(p.TopicConfig.ToARN(topic)),
		Message:          aws.String(message),
		MessageStructure: jsonMessageStructure,
	})
	if err != nil {
		return "", err
	}
	return *resp.MessageId, nil
}

type NoopPublisher struct {
}

func (p NoopPublisher) Publish(topic Topic, message string) (string, error) {
	return "", nil
}
