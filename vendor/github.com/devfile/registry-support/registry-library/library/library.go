/*   Copyright 2020-2022 Red Hat, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package library

import (
	"archive/tar"
	"compress/gzip"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strings"
	"text/tabwriter"
	"time"

	orasctx "github.com/deislabs/oras/pkg/context"

	"github.com/containerd/containerd/remotes/docker"
	"github.com/deislabs/oras/pkg/content"
	"github.com/deislabs/oras/pkg/oras"
	indexSchema "github.com/devfile/registry-support/index/generator/schema"
)

const (
	// Devfile media types
	DevfileConfigMediaType  = "application/vnd.devfileio.devfile.config.v2+json"
	DevfileMediaType        = "application/vnd.devfileio.devfile.layer.v1"
	DevfileVSXMediaType     = "application/vnd.devfileio.vsx.layer.v1.tar"
	DevfileSVGLogoMediaType = "image/svg+xml"
	DevfilePNGLogoMediaType = "image/png"
	DevfileArchiveMediaType = "application/x-tar"

	httpRequestResponseTimeout = 30 * time.Second // httpRequestTimeout configures timeout of all HTTP requests
)

var (
	DevfileMediaTypeList     = []string{DevfileMediaType}
	DevfileAllMediaTypesList = []string{DevfileMediaType, DevfilePNGLogoMediaType, DevfileSVGLogoMediaType, DevfileVSXMediaType, DevfileArchiveMediaType}
)

type Registry struct {
	registryURL      string
	registryContents []indexSchema.Schema
	err              error
}

type RegistryOptions struct {
	SkipTLSVerify bool
	User          string
	Filter        RegistryFilter
	HTTPTimeout   *int
}

type RegistryFilter struct {
	Architectures []string
}

// GetRegistryIndex returns the list of stacks and/or samples, more specifically
// it gets the stacks and/or samples content of the index of the specified registry
// for listing the stacks and/or samples
func GetRegistryIndex(registryURL string, options RegistryOptions, devfileTypes ...indexSchema.DevfileType) ([]indexSchema.Schema, error) {
	var registryIndex []indexSchema.Schema

	// Call index server REST API to get the index
	urlObj, err := url.Parse(registryURL)
	if err != nil {
		return nil, err
	}
	getStack := false
	getSample := false
	for _, devfileType := range devfileTypes {
		if devfileType == indexSchema.StackDevfileType {
			getStack = true
		} else if devfileType == indexSchema.SampleDevfileType {
			getSample = true
		}
	}

	var endpoint string
	if getStack && getSample {
		endpoint = path.Join("index", "all")
	} else if getStack && !getSample {
		endpoint = "index"
	} else if getSample && !getStack {
		endpoint = path.Join("index", "sample")
	} else {
		return registryIndex, nil
	}

	if !reflect.DeepEqual(options.Filter, RegistryFilter{}) {
		endpoint = endpoint + "?"
	}

	if len(options.Filter.Architectures) > 0 {
		for _, arch := range options.Filter.Architectures {
			endpoint = endpoint + "arch=" + arch + "&"
		}
		endpoint = strings.TrimSuffix(endpoint, "&")
	}

	endpointURL, err := url.Parse(endpoint)
	if err != nil {
		return nil, err
	}

	urlObj = urlObj.ResolveReference(endpointURL)

	url := urlObj.String()
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	if options.User != "" {
		req.Header.Add("User", options.User)
	}

	httpClient := getHTTPClient(options)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(bytes, &registryIndex)
	if err != nil {
		return nil, err
	}
	return registryIndex, nil
}

// GetMultipleRegistryIndices returns the list of stacks and/or samples of multiple registries
func GetMultipleRegistryIndices(registryURLs []string, options RegistryOptions, devfileTypes ...indexSchema.DevfileType) []Registry {
	registryList := make([]Registry, len(registryURLs))
	registryContentsChannel := make(chan []indexSchema.Schema)
	errChannel := make(chan error)

	for index, registryURL := range registryURLs {
		go func(chan []indexSchema.Schema, chan error) {
			registryContents, err := GetRegistryIndex(registryURL, options, devfileTypes...)
			registryContentsChannel <- registryContents
			errChannel <- err
		}(registryContentsChannel, errChannel)
		registryList[index].registryURL = registryURL
		registryList[index].registryContents = <-registryContentsChannel
		registryList[index].err = <-errChannel
	}
	return registryList
}

// PrintRegistry prints the registry with devfile type
func PrintRegistry(registryURLs string, devfileType string, options RegistryOptions) error {
	// Get the registry index
	registryURLArray := strings.Split(registryURLs, ",")
	var registryList []Registry

	if devfileType == string(indexSchema.StackDevfileType) {
		registryList = GetMultipleRegistryIndices(registryURLArray, options, indexSchema.StackDevfileType)
	} else if devfileType == string(indexSchema.SampleDevfileType) {
		registryList = GetMultipleRegistryIndices(registryURLArray, options, indexSchema.SampleDevfileType)
	} else if devfileType == "all" {
		registryList = GetMultipleRegistryIndices(registryURLArray, options, indexSchema.StackDevfileType, indexSchema.SampleDevfileType)
	}

	w := tabwriter.NewWriter(os.Stdout, 5, 2, 3, ' ', tabwriter.TabIndent)
	fmt.Fprintln(w, "Name", "\t", "Description", "\t", "Registry", "\t", "Error", "\t")
	for _, devfileRegistry := range registryList {
		if devfileRegistry.err != nil {
			fmt.Fprintln(w, "NONE", "\t", "NONE", "\t", devfileRegistry.registryURL, devfileRegistry.err.Error(), "\t")
		} else {
			for _, devfileEntry := range devfileRegistry.registryContents {
				fmt.Fprintln(w, devfileEntry.Name, "\t", devfileEntry.Description, "\t", devfileRegistry.registryURL, "\t", "NONE", "\t")
			}
		}
	}
	w.Flush()
	return nil
}

// PullStackByMediaTypesFromRegistry pulls stack from registry with allowed media types to the destination directory
func PullStackByMediaTypesFromRegistry(registry string, stack string, allowedMediaTypes []string, destDir string, options RegistryOptions) error {
	// Get the registry index
	registryIndex, err := GetRegistryIndex(registry, options, indexSchema.StackDevfileType)
	if err != nil {
		return err
	}

	// Parse the index to get the specified stack's metadata in the index
	var stackIndex indexSchema.Schema
	exist := false
	for _, item := range registryIndex {
		if item.Name == stack {
			stackIndex = item
			exist = true
			break
		}
	}
	if !exist {
		return fmt.Errorf("stack %s does not exist in the registry %s", stack, registry)
	}

	// Pull stack initialization
	ctx := orasctx.Background()
	urlObj, err := url.Parse(registry)
	if err != nil {
		return err
	}
	plainHTTP := true
	if urlObj.Scheme == "https" {
		plainHTTP = false
	}

	httpClient := getHTTPClient(options)

	headers := make(http.Header)
	if options.User != "" {
		headers.Add("User", options.User)
	}
	resolver := docker.NewResolver(docker.ResolverOptions{Headers: headers, PlainHTTP: plainHTTP, Client: httpClient})
	ref := path.Join(urlObj.Host, stackIndex.Links["self"])
	fileStore := content.NewFileStore(destDir)
	defer fileStore.Close()

	// Pull stack from registry and save it to disk
	_, _, err = oras.Pull(ctx, resolver, ref, fileStore, oras.WithAllowedMediaTypes(allowedMediaTypes))
	if err != nil {
		return fmt.Errorf("failed to pull stack %s from %s with allowed media types %v: %v", stack, ref, allowedMediaTypes, err)
	}

	// Decompress archive.tar
	archivePath := filepath.Join(destDir, "archive.tar")
	if _, err := os.Stat(archivePath); err == nil {
		err := decompress(destDir, archivePath)
		if err != nil {
			return err
		}

		err = os.RemoveAll(archivePath)
		if err != nil {
			return err
		}
	}

	return nil
}

// PullStackFromRegistry pulls stack from registry with all stack resources (all media types) to the destination directory
func PullStackFromRegistry(registry string, stack string, destDir string, options RegistryOptions) error {
	return PullStackByMediaTypesFromRegistry(registry, stack, DevfileAllMediaTypesList, destDir, options)
}

// decompress extracts the archive file
func decompress(targetDir string, tarFile string) error {
	reader, err := os.Open(tarFile)
	if err != nil {
		return err
	}
	defer reader.Close()

	gzReader, err := gzip.NewReader(reader)
	if err != nil {
		return err
	}
	defer gzReader.Close()

	tarReader := tar.NewReader(gzReader)
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		} else if err != nil {
			return err
		}

		target := path.Join(targetDir, header.Name)
		switch header.Typeflag {
		case tar.TypeDir:
			err = os.MkdirAll(target, os.FileMode(header.Mode))
			if err != nil {
				return err
			}
		case tar.TypeReg:
			w, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return err
			}
			_, err = io.Copy(w, tarReader)
			if err != nil {
				return err
			}
			w.Close()
		default:
			log.Printf("Unsupported type: %v", header.Typeflag)
		}
	}

	return nil
}

//getHTTPClient returns a new http client object
func getHTTPClient(options RegistryOptions) *http.Client {

	overriddenTimeout := httpRequestResponseTimeout
	timeout := options.HTTPTimeout
	//if value is invalid or unspecified, the default will be used
	if timeout != nil && *timeout > 0 {
		//convert timeout to seconds
		overriddenTimeout = time.Duration(*timeout) * time.Second
	}

	return &http.Client{
		Transport: &http.Transport{
			Proxy:                 http.ProxyFromEnvironment,
			ResponseHeaderTimeout: overriddenTimeout,
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: options.SkipTLSVerify},
		},
		Timeout: overriddenTimeout,
	}
}
