package olm

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/serverutils"
	"github.com/operator-framework/kubectl-operator/pkg/action"
	"k8s.io/klog/v2"
)

func (o *OLMHandler) operandsListHandler(w http.ResponseWriter, r *http.Request) {
	client, scheme, err := o.getClientWithScheme(r)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}
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

	client, scheme, err = o.getClientWithScheme(r)
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
