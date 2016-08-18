package manager

import (
	"fmt"
	htmltemplate "html/template"
	"path/filepath"
	texttemplate "text/template"
)

type EmailTemplateConfig struct {
	HTMLTemplates *htmltemplate.Template
	TextTemplates *texttemplate.Template
}

func NewEmailTemplateConfigFromDirs(dirs []string) (*EmailTemplateConfig, error) {
	var err error
	textTemplates := texttemplate.New("")
	htmlTemplates := htmltemplate.New("")
	for _, dir := range dirs {
		textTemplates, err = textTemplates.ParseGlob(filepath.Join(dir, "*.txt"))
		if err != nil {
			return nil, fmt.Errorf("unable to get text email templates, err: %s", err)
		}
		htmlTemplates, err = htmlTemplates.ParseGlob(filepath.Join(dir, "*.html"))
		if err != nil {
			return nil, fmt.Errorf("unable to get html email templates, err: %s", err)
		}
	}

	return &EmailTemplateConfig{
		HTMLTemplates: htmlTemplates,
		TextTemplates: textTemplates,
	}, nil
}
