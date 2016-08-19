package manager

import (
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/lib/pq"
	"github.com/pborman/uuid"
	"golang.org/x/net/context"

	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/repo"
)

type (
	PublisherType       string
	JobType             string
	JobPublisherConfig  map[pubsub.Topic][]JobType
	JobSubscriberConfig map[pubsub.Channel]JobType
)

const (
	BFAccountCreatedTopic  pubsub.Topic = "BFAccountCreated"
	SubscriptionPaidTopic  pubsub.Topic = "SubscriptionPaid"
	SubscriptionEndedTopic pubsub.Topic = "SubscriptionEnded"

	SyncQuayAccountChannel pubsub.Channel = "SyncQuayAccount"
	SyncLicenseChannel     pubsub.Channel = "SyncLicense"

	SyncQuayAccountJobType JobType = "sync_quay_account"
	SyncLicenseJobType     JobType = "sync_license"

	NoopPublisherType     PublisherType = "noop"
	PostgresPublisherType PublisherType = "postgres"
)

var (
	defaultJobPublisherConfig = JobPublisherConfig{
		BFAccountCreatedTopic: []JobType{
			SyncQuayAccountJobType,
		},
		SubscriptionPaidTopic: []JobType{
			SyncQuayAccountJobType, SyncLicenseJobType,
		},
		SubscriptionEndedTopic: []JobType{
			SyncQuayAccountJobType, SyncLicenseJobType,
		},
	}

	defaultJobSubscriberConfig = JobSubscriberConfig{
		SyncQuayAccountChannel: SyncQuayAccountJobType,
		SyncLicenseChannel:     SyncLicenseJobType,
	}
)

type PostgresJobPublisher struct {
	DB     db.DB
	Config JobPublisherConfig
}

func NewPostgresJobPublisher(db db.DB, cfg JobPublisherConfig) *PostgresJobPublisher {
	pubCfg := cfg
	if pubCfg == nil {
		pubCfg = defaultJobPublisherConfig
	}
	return &PostgresJobPublisher{
		DB:     db,
		Config: pubCfg,
	}
}

func (p *PostgresJobPublisher) Publish(topic pubsub.Topic, message string) (string, error) {
	msg := []byte(message)
	publishID := uuid.New()
	if err := db.WithTransaction(p.DB, func(tx db.Queryer) error {
		for _, jobType := range p.Config[topic] {
			_, err := repo.CreateJob(tx, publishID, string(jobType), msg)
			if err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return "", err
	}
	return publishID, nil
}

type PostgresJobSubscriber struct {
	DB                   db.DB
	PQListener           *pq.Listener
	Config               JobSubscriberConfig
	Logger               *logrus.Entry
	WaitTimeSec          int64
	VisibilityTimeoutSec int64
	MaxAttempts          int64
}

func NewPostgresJobSubscriber(logger *logrus.Entry, db db.DB, listener *pq.Listener, cfg JobSubscriberConfig, waitTime, maxAttempts, visibilityTimeout int64) *PostgresJobSubscriber {
	subCfg := cfg
	if subCfg == nil {
		subCfg = defaultJobSubscriberConfig
	}
	subLogger := logger.WithField("component", "postgres-job-subscriber")
	return &PostgresJobSubscriber{
		DB:                   db,
		PQListener:           listener,
		Logger:               subLogger,
		Config:               subCfg,
		WaitTimeSec:          waitTime,
		MaxAttempts:          maxAttempts,
		VisibilityTimeoutSec: visibilityTimeout,
	}
}

func (s *PostgresJobSubscriber) Pull(c pubsub.Channel, maxMsgs int64) ([]*pubsub.Message, error) {
	jobType := s.Config[c]
	var msgs []*pubsub.Message
	err := db.WithTransaction(s.DB, func(tx db.Queryer) error {
		jobs, err := repo.GetAvailableJobs(s.DB, string(jobType), maxMsgs, s.MaxAttempts, s.VisibilityTimeoutSec)
		if err != nil {
			if serrors.TypeOf(err) == serrors.NotFound {
				return nil
			}
			return err
		}
		msgs = make([]*pubsub.Message, 0, len(jobs))
		for _, job := range jobs {
			if job.Attempts >= s.MaxAttempts {
				s.Logger.WithFields(logrus.Fields{
					"jobID":       job.ID,
					"attempts":    job.Attempts,
					"maxAttempts": s.MaxAttempts,
				}).Warn("job has reached max number of attempts, this is the last attempt")
			}
			msgs = append(msgs, &pubsub.Message{
				MessageID: job.ID,
				AckID:     job.ID,
				Data:      job.Message,
				Attempts:  job.Attempts,
			})
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return msgs, nil
}

func (s *PostgresJobSubscriber) Acknowledge(c pubsub.Channel, ackID string) error {
	jobType := s.Config[c]
	return repo.CompleteJob(s.DB, ackID, string(jobType))
}

func (s *PostgresJobSubscriber) PullWait(ctx context.Context, c pubsub.Channel, maxMsgs int64) ([]*pubsub.Message, error) {
	jobType := s.Config[c]
	pgChannel := string(jobType)
	err := s.PQListener.Listen(pgChannel)
	if err != nil {
		return nil, err
	}
	defer s.PQListener.Unlisten(pgChannel)
	for {
		msgs, err := s.Pull(c, maxMsgs)
		if err != nil {
			return nil, err
		}
		if len(msgs) > 0 {
			return msgs, nil
		}
		err = s.waitForNotification(ctx)
		if err != nil {
			if err == context.DeadlineExceeded {
				err = nil
			}
			return nil, err
		}
	}
}

func (s *PostgresJobSubscriber) waitForNotification(ctx context.Context) error {
	waitTime := time.Duration(s.WaitTimeSec) * time.Second
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-s.PQListener.Notify:
			s.Logger.Debug("received notification, new work available")
			return nil
		case <-time.After(waitTime):
			go func() {
				s.PQListener.Ping()
			}()
			// Check if there's more work available, just in case it takes
			// a while for the Listener to notice connection loss and
			// reconnect.
			s.Logger.Debugf("received no work for %d seconds, checking for new work", s.WaitTimeSec)
			return nil
		}
	}
}
