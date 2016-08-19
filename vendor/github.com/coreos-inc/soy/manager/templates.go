package manager

import "text/template"

type secretTemplateParams struct {
	MetadataName string
	SecretName   string
	SecretData   string
	Type         string
}

var (
	rawSecretTemplate = `apiVersion: v1
kind: Secret
metadata:
  name: {{ .MetadataName }}
data:
  {{ .SecretName  }}: {{ .SecretData }}
{{ if ne .Type "" }}type: {{ .Type }}{{ end }}`
	secretTemplate *template.Template
)

func init() {
	secretTemplate = template.Must(template.New("secretTemplate").Parse(rawSecretTemplate))
}
