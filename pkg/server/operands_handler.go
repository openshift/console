package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/operator-framework/kubectl-operator/pkg/action"
	"k8s.io/client-go/rest"
	"k8s.io/klog"

	"sigs.k8s.io/controller-runtime/pkg/client"
)

type OperandsListHandler struct {
	APIServerURL string
	Client       *http.Client
}

func (o *OperandsListHandler) GetConfig(user *auth.User) (*rest.Config, error) {
	config := &rest.Config{
		Host:        o.APIServerURL,
		Transport:   o.Client.Transport,
		BearerToken: user.Token,
	}
	return config, nil
}

func (o *OperandsListHandler) OperandsListHandler(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}

	query := r.URL.Query()
	operatorName := query.Get("name")
	operatorNamespace := query.Get("namespace")
	if len(operatorName) < 1 || len(operatorNamespace) < 1 {
		errMsg := fmt.Sprintf("Failed to get operator name or namespace from the request URL: %q", r.URL.String())
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	scheme, err := action.NewScheme()
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get new scheme for operator client: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	config, err := o.GetConfig(user)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get new config for operator client: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	client, err := client.New(config, client.Options{
		Scheme: scheme,
	})
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get new client for listing operands: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	cfg := &action.Configuration{
		Client:    client,
		Scheme:    scheme,
		Namespace: operatorNamespace,
	}
	operatorListOperands := action.NewOperatorListOperands(cfg)
	operandsList, err := operatorListOperands.Run(context.TODO(), operatorName)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to list operands: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	resp, err := json.Marshal(operandsList)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to marshal the list operands response: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	w.Write(resp)
}
