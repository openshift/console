package hookhandler

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	"golang.org/x/net/context"

	logrus "github.com/Sirupsen/logrus"

	pb "github.com/coreos-inc/soy/proto/eventpb"
)

type Config struct {
	AuthUsername string
	AuthPassword string
}

type BFHookHandler struct {
	Config       Config
	Logger       *logrus.Entry
	EventService pb.EventServiceClient
	Handlers     map[NotificationKey]Handler
}

func New(logger *logrus.Entry, config Config, eventService pb.EventServiceClient) *BFHookHandler {
	h := &BFHookHandler{
		Config:       config,
		Logger:       logger.WithField("package", "hookhandler"),
		EventService: eventService,
	}

	handlers := map[NotificationKey]Handler{
		{
			Domain: "Subscription",
			Action: "Provisioned",
		}: HandlerFunc(h.SubscriptionProvisionedHandler),
		{
			Domain: "Subscription",
			Action: "AwaitingPayment",
		}: HandlerFunc(h.SubscriptionAwaitingPaymentHandler),
		{
			Domain: "Subscription",
			Action: "Paid",
		}: HandlerFunc(h.SubscriptionPaidHandler),
		{
			Domain: "Amendment",
			Action: "",
		}: HandlerFunc(h.AmendmentHandler),
		{
			Domain: "Account",
			Action: "Created",
		}: HandlerFunc(h.AccountCreatedHandler),
		{
			Domain: "PaymentMethod",
			Action: "Active",
		}: HandlerFunc(h.PaymentMethodCreatedHandler),
		{
			Domain: "PaymentMethod",
			Action: "Updated",
		}: HandlerFunc(h.PaymentMethodCreatedHandler),
	}
	h.Handlers = handlers

	return h
}

func (h *BFHookHandler) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if req.Method != "POST" {
		http.Error(w, "expected HTTP method to be POST", http.StatusInternalServerError)
		return
	}

	if h.Config.AuthUsername != "" && h.Config.AuthPassword != "" {
		if username, password, ok := req.BasicAuth(); !ok || username != h.Config.AuthUsername || password != h.Config.AuthPassword {
			http.Error(w, "invalid authentication credentials", http.StatusUnauthorized)
			return
		}
	}

	data, err := ioutil.ReadAll(req.Body)
	if err != nil {
		h.Logger.WithError(err).Info("unable to read request body")
		http.Error(w, "unable to read request body", http.StatusInternalServerError)
		return
	}
	req.Body.Close()

	var notification pb.Notification
	err = json.Unmarshal(data, &notification)
	if err != nil {
		h.Logger.WithError(err).Error("unable to decode request body into notification")
		http.Error(w, "unable unmarshal notification", http.StatusInternalServerError)
		return
	}
	notification.RawPayload = data

	logger := h.logger(&notification)

	if handler, ok := h.getHandler(&notification); ok {
		if err := handler.Handle(&notification); err != nil {
			logger.WithError(err).Error("error handling notification")
			http.Error(w, "unable to handle notification", http.StatusInternalServerError)
			return
		}
		logger.Info("successfully handled notification")
	} else {
		logger.Debugf("ignoring notification of domain %s and action: %s, no handler", notification.Domain, notification.Action)
	}

	w.WriteHeader(http.StatusOK)
}

func (h *BFHookHandler) logger(notification *pb.Notification) *logrus.Entry {
	return h.Logger.WithFields(logrus.Fields{
		"domain":   notification.Domain,
		"action":   notification.Action,
		"entityID": notification.EntityID,
	})
}

type NotificationKey struct {
	Domain string
	Action string
}

func (h *BFHookHandler) getHandler(notification *pb.Notification) (Handler, bool) {
	handler, ok := h.Handlers[NotificationKey{
		Domain: notification.Domain,
		Action: notification.Action,
	}]
	if !ok {
		// Try without the action, to see if we have a handler registered for
		// all actions of a given domain.
		handler, ok = h.Handlers[NotificationKey{
			Domain: notification.Domain,
		}]
	}
	return handler, ok
}

type Handler interface {
	Handle(*pb.Notification) error
}

type HandlerFunc func(*pb.Notification) error

func (f HandlerFunc) Handle(notification *pb.Notification) error {
	return f(notification)
}

func (h *BFHookHandler) SubscriptionProvisionedHandler(notification *pb.Notification) error {
	resp, err := h.EventService.SubscriptionProvisioned(context.Background(), &pb.SubscriptionProvisionedReq{
		Notification: notification,
	})
	if err != nil {
		return err
	}
	if !resp.Activated {
		h.logger(notification).Infof("subscription %s not activated", notification.EntityID)
	}
	return nil
}

func (h *BFHookHandler) SubscriptionAwaitingPaymentHandler(notification *pb.Notification) error {
	_, err := h.EventService.SubscriptionAwaitingPayment(context.Background(), &pb.SubscriptionAwaitingPaymentReq{
		Notification: notification,
	})
	return err
}

func (h *BFHookHandler) SubscriptionPaidHandler(notification *pb.Notification) error {
	_, err := h.EventService.SubscriptionPaid(context.Background(), &pb.SubscriptionPaidReq{
		Notification: notification,
	})
	return err
}

func (h *BFHookHandler) AccountCreatedHandler(notification *pb.Notification) error {
	_, err := h.EventService.AccountCreated(context.Background(), &pb.AccountCreatedReq{
		Notification: notification,
	})
	return err
}

func (h *BFHookHandler) PaymentMethodCreatedHandler(notification *pb.Notification) error {
	_, err := h.EventService.PaymentMethodCreated(context.Background(), &pb.PaymentMethodCreatedReq{
		Notification: notification,
	})
	return err
}

func (h *BFHookHandler) AmendmentHandler(notification *pb.Notification) error {
	logger := h.logger(notification)

	var amendment struct {
		AmendmentType  string `json:"amendmentType"`
		Type           string `json:"type"`
		State          string `json:"state"`
		SubscriptionID string `json:"subscriptionID"`
	}
	err := json.Unmarshal([]byte(notification.Entity), &amendment)
	if err != nil {
		return err
	}
	logger = logger.WithFields(logrus.Fields{
		"subscriptionID": amendment.SubscriptionID,
		"state":          amendment.State,
	})

	// At some point Billforward changed the name of this field to "type",
	// but we'll keep the code which expects the old field name as well, just
	// in case.
	var amendmentType string
	if amendment.AmendmentType != "" {
		amendmentType = amendment.AmendmentType
	} else if amendment.Type != "" {
		amendmentType = amendment.Type
	} else {
		logger.Error("unable to process amendment, no AmendmentType or Type field in notification.entity")
		return nil
	}

	if amendmentType != "ServiceEnd" && amendmentType != "ServiceEndAmendment" {
		logger.Infof("not processing amendment of type %s", amendment.AmendmentType)
		return nil
	}
	if amendment.State != "Succeeded" {
		logger.Infof("not processing amendment with State != Succeeded, State: %s", amendment.State)
		return nil
	}
	_, err = h.EventService.ServiceEndSucceeded(context.Background(), &pb.ServiceEndSucceededReq{
		Notification: notification,
	})
	return err
}
