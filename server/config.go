package server

import "net/url"

type K8sConfig struct {
	Endpoint                 *url.URL
	APIService               string
	ControllerManagerService string
	SchedulerService         string
}
