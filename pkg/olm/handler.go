package olm

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/operator-framework/kubectl-operator/pkg/action"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

	olmv1 "github.com/operator-framework/operator-lifecycle-manager/pkg/package-server/apis/operators/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type OLMHandler struct {
	APIServerURL string
	Client       *http.Client
}

func (o *OLMHandler) GetConfig(user *auth.User) (*rest.Config, error) {
	config := &rest.Config{
		Host:      o.APIServerURL,
		Transport: o.Client.Transport,
	}

	if user != nil {
		config.BearerToken = user.Token
	}

	return config, nil
}

func (o *OLMHandler) OperandsList(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}

	operatorName, operatorNamespace, err := o.getOperatorMeta(r)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	client, scheme, err := o.getClientWithScheme(user)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprint(err)})
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

func (o *OLMHandler) CheckPackageManifest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}

	operatorName, operatorNamespace, err := o.getOperatorMeta(r)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	client, _, err := o.getClientWithScheme(nil)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	packageManifest := olmv1.PackageManifest{}
	err = client.Get(context.TODO(), types.NamespacedName{Name: operatorName, Namespace: operatorNamespace}, &packageManifest)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get operator: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = json.Marshal(packageManifest)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to marshal %q operator response: %v", operatorName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	serverutils.SendResponse(w, http.StatusOK, nil)
}

func (o *OLMHandler) getOperatorMeta(r *http.Request) (string, string, error) {
	query := r.URL.Query()
	operatorName := query.Get("name")
	operatorNamespace := query.Get("namespace")
	if len(operatorName) < 1 || len(operatorNamespace) < 1 {
		return "", "", fmt.Errorf("failed to get operator name or namespace from the request URL: %q", r.URL.String())
	}
	return operatorName, operatorNamespace, nil
}

func (o *OLMHandler) getClientWithScheme(user *auth.User) (client.Client, *runtime.Scheme, error) {
	scheme, err := action.NewScheme()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get new scheme for olm client: %v", err)
	}
	config, err := o.GetConfig(user)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get new config for olm client: %v", err)
	}
	client, err := client.New(config, client.Options{
		Scheme: scheme,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get new olm client: %v", err)
	}
	return client, scheme, nil
}
