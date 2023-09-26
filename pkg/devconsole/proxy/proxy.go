package proxy

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/openshift/console/pkg/serverutils"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	path := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	if len(path) == 2 && path[0] == "proxy" && path[1] == "internet" {
		// POST  /api/dev-console/proxy/internet
		if r.Method == http.MethodPost {
			response, err := serve(r)
			if err != nil {
				serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
				return
			}
			serverutils.SendResponse(w, http.StatusOK, response)
			return
		} else {
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only POST is allowed"})
			return
		}
	} else {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "Invalid URL"})
		return
	}
}

func serve(r *http.Request) (ProxyResponse, error) {
	var request ProxyRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return ProxyResponse{}, fmt.Errorf("Failed to parse request: %v", err)
	}

	if request.Method == "" {
		request.Method = http.MethodGet
	}

	var serviceRequest *http.Request
	if request.Body == "" {
		serviceRequest, err = http.NewRequest(request.Method, request.Url, nil)
	} else {
		serviceRequest, err = http.NewRequest(request.Method, request.Url, strings.NewReader(request.Body))
	}

	if err != nil {
		return ProxyResponse{}, fmt.Errorf("Failed to create request: %v", err)
	}

	for key, values := range request.Headers {
		for _, value := range values {
			serviceRequest.Header.Add(key, value)
		}
	}

	query := serviceRequest.URL.Query()
	for key, values := range request.Queryparams {
		for _, value := range values {
			query.Add(key, value)
		}
	}
	serviceRequest.URL.RawQuery = query.Encode()

	var serviceClient *http.Client
	if request.AllowInsecure {
		serviceTransport := &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
		serviceClient = &http.Client{
			Transport: serviceTransport,
		}
	} else {
		serviceClient = &http.Client{}
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return ProxyResponse{}, fmt.Errorf("Failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return ProxyResponse{}, fmt.Errorf("Failed to read response body: %v", err)
	}

	return ProxyResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil
}
