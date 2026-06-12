package olm

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	registryapi "github.com/operator-framework/operator-registry/pkg/api"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	grpcstatus "google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"k8s.io/apimachinery/pkg/util/validation"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

const grpcTimeout = 10 * time.Second

const lifecycleSchema = "io.openshift.operators.lifecycles.v1alpha1"

func isValidK8sName(s string) bool {
	return len(validation.IsDNS1123Label(s)) == 0
}

func catalogSourceGRPCAddress(catalogNamespace, catalogName string) string {
	return fmt.Sprintf("%s.%s.svc:50051", catalogName, catalogNamespace)
}

func (o *OLMHandler) lifecycleHandler(w http.ResponseWriter, r *http.Request) {
	catalogNamespace := r.PathValue("catalogNamespace")
	catalogName := r.PathValue("catalogName")
	packageName := r.PathValue("packageName")

	klog.Infof("[lifecycle] Received request: catalogNamespace=%q catalogName=%q packageName=%q", catalogNamespace, catalogName, packageName)

	if !isValidK8sName(catalogNamespace) {
		klog.Infof("[lifecycle] Invalid catalogNamespace: %q", catalogNamespace)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "The catalog namespace is not valid."})
		return
	}

	if !isValidK8sName(catalogName) {
		klog.Infof("[lifecycle] Invalid catalogName: %q", catalogName)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "The catalog name is not valid."})
		return
	}

	if packageName == "" {
		klog.Infof("[lifecycle] Missing packageName")
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "The package name is required."})
		return
	}

	target := catalogSourceGRPCAddress(catalogNamespace, catalogName)
	klog.Infof("[lifecycle] Dialing CatalogSource gRPC at %s", target)

	conn, err := grpc.NewClient(target, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		klog.Errorf("[lifecycle] Failed to create gRPC client for %s: %v", target, err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to connect to the catalog source."})
		return
	}
	defer conn.Close()

	client := registryapi.NewExperimentalRegistryClient(conn)
	ctx, cancel := context.WithTimeout(r.Context(), grpcTimeout)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, "x-acknowledge-experimental", "true")
	stream, err := client.ExperimentalListPackageCustomSchemas(ctx, &registryapi.ExperimentalListPackageCustomSchemasRequest{
		Schema:      lifecycleSchema,
		PackageName: packageName,
	})
	if err != nil {
		handleGRPCError(w, catalogName, packageName, err)
		return
	}

	result, err := stream.Recv()
	if err != nil {
		if err == io.EOF {
			klog.Infof("[lifecycle] No lifecycle data for %s/%s", catalogName, packageName)
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "No lifecycle data is available for this package."})
			return
		}
		handleGRPCError(w, catalogName, packageName, err)
		return
	}

	// Expect exactly one lifecycle document per package. If the stream
	// contains additional documents, treat it as ambiguous data.
	if _, err := stream.Recv(); err == nil {
		klog.Errorf("[lifecycle] Multiple lifecycle documents returned for %s/%s — expected exactly one", catalogName, packageName)
		serverutils.SendResponse(w, http.StatusConflict, serverutils.ApiError{Err: "Multiple lifecycle records exist for this package."})
		return
	} else if err != io.EOF {
		handleGRPCError(w, catalogName, packageName, err)
		return
	}

	jsonBytes, err := protojson.Marshal(result)
	if err != nil {
		klog.Errorf("[lifecycle] Failed to marshal lifecycle response: %v", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "An error occurred while processing the response."})
		return
	}

	klog.Infof("[lifecycle] Returning lifecycle data for %s/%s", catalogName, packageName)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonBytes)
}

func handleGRPCError(w http.ResponseWriter, catalogName, packageName string, err error) {
	st, ok := grpcstatus.FromError(err)
	if !ok {
		klog.Errorf("[lifecycle] gRPC call failed for %s/%s: %v", catalogName, packageName, err)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: "The catalog source is unavailable. Try again later."})
		return
	}

	switch st.Code() {
	case codes.Unimplemented:
		klog.Infof("[lifecycle] ExperimentalListPackageCustomSchemas not supported by catalog %s", catalogName)
		serverutils.SendResponse(w, http.StatusServiceUnavailable, serverutils.ApiError{Err: "Lifecycle metadata is not available for this catalog."})
	case codes.Unavailable:
		klog.Infof("[lifecycle] CatalogSource %s gRPC unavailable: %v", catalogName, st.Message())
		serverutils.SendResponse(w, http.StatusServiceUnavailable, serverutils.ApiError{Err: "The catalog source is unavailable. Try again later."})
	default:
		klog.Errorf("[lifecycle] gRPC error for %s/%s: code=%s msg=%s", catalogName, packageName, st.Code(), st.Message())
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: "An error occurred while contacting the catalog source."})
	}
}
