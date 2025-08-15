package olm

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/serverutils"
	"k8s.io/klog/v2"

	olmv1 "github.com/operator-framework/operator-lifecycle-manager/pkg/package-server/apis/operators/v1"
	"k8s.io/apimachinery/pkg/types"
)

func (o *OLMHandler) checkPackageManifestHandler(w http.ResponseWriter, r *http.Request) {
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

	client, _, err := o.getClientWithScheme(r)
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
