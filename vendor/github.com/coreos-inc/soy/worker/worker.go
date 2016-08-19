package worker

import (
	"time"

	"github.com/lib/pq"

	"github.com/Sirupsen/logrus"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/coreos/pkg/timeutil"
	"golang.org/x/net/context"

	"github.com/coreos-inc/soy/common"
	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/job"
	"github.com/coreos-inc/soy/manager"
	"github.com/coreos-inc/soy/repo"
)

const defaultMaxMessages = 1

var rpcTimeout = 30 * time.Second

type AWSConfig struct {
	AWSRegion   string
	QueueURL    string
	QueueConfig pubsub.AWSQueueConfig
}

type Config struct {
	WaitTimeSec          int64
	MaxBackoffSec        int64
	VisibilityTimeoutSec int64
}

func NewAWSWorker(logger *logrus.Entry, cfg Config, awsCfg AWSConfig) (*Worker, error) {
	awsLogger := &common.AWSLogger{logger.WithField("package", "aws")}
	awsConfig := aws.NewConfig().WithLogger(awsLogger).WithRegion(awsCfg.AWSRegion)
	awsSession := session.New(awsConfig)

	/*
		if awsCfg.QueueURL != "" {
			logger.WithFields(logrus.Fields{
				"channel":  channel,
				"queueURL": awsCfg.QueueURL,
			}).Info("explicitly overriding QueueURL for channel")
		}

		if !awsCfg.QueueConfig.QueueURLExists(channel) {
			logger.WithField("channel", channel).Info("queueURL does not exist for channel, attempting to retrieve")
			sqsClient := sqs.New(awsSession)
			resp, err := sqsClient.GetQueueUrl(&sqs.GetQueueUrlInput{
				QueueName: aws.String(string(channel)),
			})
			if err != nil {
				return nil, fmt.Errorf("unable to get QueueURL for channel %s, err: %s", channel, err)
			}
			awsCfg.QueueConfig.SetQueueURL(channel, aws.StringValue(resp.QueueUrl))
		}

		logger.WithFields(logrus.Fields{
			"channel":  channel,
			"queueURL": awsCfg.QueueURL,
		}).Info("queue settings configured")
	*/

	subscriber := pubsub.NewAWSSQSSubscriber(awsSession, awsCfg.QueueConfig, cfg.WaitTimeSec, cfg.VisibilityTimeoutSec)

	return &Worker{
		Subscriber: subscriber,
		Logger:     logger,
	}, nil
}

func NewPostgresWorker(logger *logrus.Entry, dbConn db.DB, cfg Config, dbCfg db.Config, maxAttempts int64) (*Worker, error) {
	pgLogger := logger.WithField("component", "postgres-worker")
	reportProblem := func(ev pq.ListenerEventType, err error) {
		if err != nil {
			pgLogger.WithError(err).Error("error encountered with the postgres listener")
		}
	}

	err := repo.PrepareStatements(dbConn)
	if err != nil {
		return nil, err
	}

	maxBackoff := time.Second * time.Duration(cfg.MaxBackoffSec)
	pqListener := pq.NewListener(dbCfg.DSN, time.Second, maxBackoff, reportProblem)
	subscriber := manager.NewPostgresJobSubscriber(pgLogger, dbConn, pqListener, nil, cfg.WaitTimeSec, maxAttempts, cfg.VisibilityTimeoutSec)

	return &Worker{
		Subscriber:  subscriber,
		Logger:      pgLogger,
		MaxAttempts: maxAttempts,
	}, nil
}

type Worker struct {
	Subscriber  pubsub.Subscriber
	Logger      *logrus.Entry
	MaxAttempts int64
}

func (w *Worker) Start(cfg Config, channel pubsub.Channel, handler job.Handler) error {
	backoff := time.Second
	maxBackoff := time.Second * time.Duration(cfg.MaxBackoffSec)

	for {
		ctx, _ := context.WithTimeout(context.Background(), rpcTimeout)
		err := w.PullAndHandle(ctx, channel, defaultMaxMessages, handler)
		if err != nil {
			w.Logger.WithField("channel", string(channel)).Infof("could not handle job, backing off %s", backoff)
			time.Sleep(backoff)
			backoff = timeutil.ExpBackoff(backoff, maxBackoff)
		} else {
			backoff = time.Second
		}
	}
}

func (w *Worker) PullAndHandle(ctx context.Context, channel pubsub.Channel, maxMsgs int64, handler job.Handler) error {
	msgs, err := pubsub.PullWait(ctx, w.Subscriber, channel, maxMsgs)
	if err != nil {
		return err
	}
	for _, msg := range msgs {
		logger := w.Logger.WithFields(logrus.Fields{
			"jobID":       msg.MessageID,
			"attempts":    msg.Attempts,
			"maxAttempts": w.MaxAttempts,
			"channel":     string(channel),
		})
		err = handler.HandleJob(msg)
		if err != nil {
			if msg.Attempts >= w.MaxAttempts {
				logger.WithError(err).Error("could not handle job, job has reached maximum number of attempts")
			} else {
				logger.WithError(err).Warn("could not handle job")
			}
			return err
		}
		err = w.Subscriber.Acknowledge(channel, msg.AckID)
		if err != nil {
			if msg.Attempts >= w.MaxAttempts {
				logger.WithError(err).Error("could not acknowledge job, job has reached maximum number of attempts")
			} else {
				logger.WithError(err).Warn("could not acknowledge job")
			}
			return err
		}
	}
	return nil
}
