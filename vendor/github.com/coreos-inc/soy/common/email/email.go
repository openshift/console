package email

import (
	"fmt"
	"net/mail"
	"strings"

	"github.com/mailgun/mailgun-go"
)

type logger interface {
	Printf(format string, v ...interface{})
}

type EmailMessage struct {
	Subject string
	From    string
	To      []string
	BCC     []string
	Headers mail.Header
	Text    string
	HTML    string
}

type Emailer interface {
	SendEmail(*EmailMessage) error
}

type EmailConfig struct {
	From           string
	BCC            []string
	DefaultHeaders mail.Header
}

type FakeEmailer struct{}

func (f FakeEmailer) SendEmail(msg *EmailMessage) error {
	fmt.Printf("From: %v\n", msg.From)
	fmt.Printf("Subject: %v\n", msg.Subject)
	fmt.Printf("To: %s\n", strings.Join(msg.To, ","))
	fmt.Printf("BCC: %s\n", strings.Join(msg.BCC, ", "))
	for header := range msg.Headers {
		fmt.Printf("%s: %s\n", header, msg.Headers.Get(header))
	}

	fmt.Printf("Body(text):\n%v\n", msg.Text)
	fmt.Printf("Body(html):\n%v\n", msg.HTML)
	return nil
}

type MailgunEmailer struct {
	Client   mailgun.Mailgun
	TestMode bool
	Logger   logger
}

func (e *MailgunEmailer) SendEmail(msg *EmailMessage) error {
	mgMsg := e.Client.NewMessage(msg.From, msg.Subject, msg.Text, msg.To...)
	if e.TestMode {
		mgMsg.EnableTestMode()
	}
	for _, bcc := range msg.BCC {
		mgMsg.AddBCC(bcc)
	}
	for k := range msg.Headers {
		mgMsg.AddHeader(k, msg.Headers.Get(k))
	}
	mgMsg.SetHtml(msg.HTML)

	statusMessage, id, err := e.Client.Send(mgMsg)
	if err != nil {
		return err
	}
	e.Logger.Printf("email status message %s, messageID: %s", statusMessage, id)
	return nil
}
