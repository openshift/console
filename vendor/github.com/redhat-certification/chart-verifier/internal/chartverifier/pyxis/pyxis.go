/*
 * Copyright 2021 Red Hat
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package pyxis

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"
)

var pyxisBaseURL = "https://catalog.redhat.com/api/containers/v1/repositories"

type RepositoriesBody struct {
	PyxisRepositories []PyxisRepository `json:"data"`
	Page              int               `json:"page"`
	PageSize          int               `json:"page_size"`
	Total             int               `json:"total"`
}

type PyxisRepository struct {
	ID          string `json:"_id"`
	Repository  string `json:"repository"`
	VendorLabel string `json:"vendor_label"`
	Registry    string `json:"registry"`
}

type RegistriesBody struct {
	PyxisRegistries []PyxisRegistry `json:"data"`
	Page            int             `json:"page"`
	PageSize        int             `json:"page_size"`
	Total           int             `json:"total"`
}

type PyxisRegistry struct {
	ID           string               `json:"_id"`
	ImageID      string               `json:"image_id"`
	Repositories []RegistryRepository `json:"repositories"`
}

type RegistryRepository struct {
	Registry   string          `json:"registry"`
	Repository string          `json:"repository"`
	Tags       []RepositoryTag `json:"tags"`
}

type RepositoryTag struct {
	Digest string `json:"manifest_schema1_digest"`
	Name   string `json:"name"`
}

type ImageReference struct {
	Registries []string
	Repository string
	Tag        string
	Sha        string
}

func GetImageRegistries(repository string) ([]string, error) {
	var err error
	var registries []string

	read := 0
	total := 0
	nextPage := 0
	allDataRead := false

	for !allDataRead {
		utils.LogInfo(fmt.Sprintf("Look for repository %s at %s, page %d", repository, pyxisBaseURL, nextPage))
		req, _ := http.NewRequest("GET", pyxisBaseURL, nil)
		queryString := req.URL.Query()
		queryString.Add("filter", fmt.Sprintf("repository==%s", repository))
		queryString.Add("page_size", "100")
		queryString.Add("page", fmt.Sprintf("%d", nextPage))
		req.URL.RawQuery = queryString.Encode()
		req.Header.Set("X-API-KEY", "RedHatChartVerifier")
		client := &http.Client{}
		resp, reqErr := client.Do(req)
		if reqErr != nil {
			err = fmt.Errorf("error getting repository %s : %v", repository, err)
		} else {
			// #nosec G307
			defer resp.Body.Close()
			if resp.StatusCode == 200 {
				body, _ := io.ReadAll(resp.Body)
				var repositoriesBody RepositoriesBody
				//nolint:errcheck // TODO(komish): this should be checked, but we really need
				// to look at refactoring this block in its entirety. Delay fixing this until then.
				json.Unmarshal(body, &repositoriesBody)

				if total == 0 {
					total = repositoriesBody.Total
				}
				read += repositoriesBody.PageSize
				if read >= total {
					allDataRead = true
				} else {
					nextPage += 1
				}
				utils.LogInfo(fmt.Sprintf("page: %d, page_size: %d, total: %d", repositoriesBody.Page, repositoriesBody.PageSize, total))
				if len(repositoriesBody.PyxisRepositories) > 0 {
					for _, repo := range repositoriesBody.PyxisRepositories {
						registries = append(registries, repo.Registry)
						utils.LogInfo(fmt.Sprintf("Found repository in registry: %s", repo.Registry))
					}
				} else {
					err = fmt.Errorf("repository not found: %s", repository)
				}
			} else {
				err = fmt.Errorf("bad response code from Pyxis: %d : %s", resp.StatusCode, req.URL)
			}
		}
	}
	if err != nil {
		utils.LogError(err.Error())
	}
	return registries, err
}

func IsImageInRegistry(imageRef ImageReference) (bool, error) {
	var err error
	found := false

	var tags []string
	var shas []string

Loops:
	for _, registry := range imageRef.Registries {
		read := 0
		total := 0
		nextPage := 0
		allDataRead := false

		requestURL := fmt.Sprintf("%s/registry/%s/repository/%s/images", pyxisBaseURL, registry, imageRef.Repository)
		utils.LogInfo(fmt.Sprintf("Search url: %s, tag: %s, sha: %s ", requestURL, imageRef.Tag, imageRef.Sha))

		for !allDataRead && err == nil && !found {
			req, _ := http.NewRequest("GET", requestURL, nil)
			queryString := req.URL.Query()
			queryString.Add("filter", fmt.Sprintf("repositories=em=(repository==%s;registry==%s)", imageRef.Repository, registry))
			queryString.Add("page_size", "100")
			queryString.Add("page", fmt.Sprintf("%d", nextPage))
			req.URL.RawQuery = queryString.Encode()
			req.Header.Set("X-API-KEY", "RedHatChartVerifier")
			client := &http.Client{}
			resp, reqErr := client.Do(req)

			if reqErr == nil {
				// #nosec G307
				defer resp.Body.Close()
				if resp.StatusCode == 200 {
					// TODO(komish): this should be checked, but we really need
					// to look at refactoring this block in its entirety. Delay fixing this until then
					//
					//nolint:errcheck
					body, _ := io.ReadAll(resp.Body)
					var registriesBody RegistriesBody
					//nolint:errcheck
					json.Unmarshal(body, &registriesBody)

					if total == 0 {
						total = registriesBody.Total
					}
					read += registriesBody.PageSize
					if read >= total {
						allDataRead = true
					} else {
						nextPage += 1
					}
					utils.LogInfo(fmt.Sprintf("page: %d, page_size: %d, total: %d", registriesBody.Page, registriesBody.PageSize, registriesBody.Total))

					if len(registriesBody.PyxisRegistries) > 0 {
						found = false
						for _, reg := range registriesBody.PyxisRegistries {
							if len(imageRef.Sha) > 0 {
								if imageRef.Sha == reg.ImageID {
									utils.LogInfo(fmt.Sprintf("sha found: %s", imageRef.Sha))
									found = true
									err = nil
									continue Loops
								} else {
									shas = append(shas, reg.ImageID)
								}
							} else {
								for _, repo := range reg.Repositories {
									if repo.Repository == imageRef.Repository && repo.Registry == registry {
										if len(imageRef.Sha) == 0 {
											for _, tag := range repo.Tags {
												if tag.Name == imageRef.Tag {
													utils.LogInfo(fmt.Sprintf("tag found: %s", imageRef.Tag))
													found = true
													err = nil
													continue Loops
												} else {
													tags = append(tags, tag.Name)
												}
											}
										}
									}
								}
							}
						}
					} else {
						// Note(komish): For now, leaving this capitalized "No" because this value is checked in the
						// checks library to decide whether or not a check is considered acceptably passed, specifically
						// when working with certified images or internal registries. Better to deal with this
						// by itself at a future date than introduce a potentially subtle bug.
						//
						//nolint:staticcheck // ST1005
						err = fmt.Errorf("No images found for Registry/Repository: %s/%s", registry, imageRef.Repository)
					}
				} else {
					err = fmt.Errorf("bad response code %d from pyxis request : %s", resp.StatusCode, requestURL)
				}
			} else {
				err = reqErr
			}
		}
	}
	if !found {
		if err == nil {
			if len(imageRef.Sha) > 0 {
				err = fmt.Errorf("digest %s not found. Found : %s", imageRef.Sha, strings.Join(shas, ", "))
			} else {
				err = fmt.Errorf("tag %s not found. Found : %s", imageRef.Tag, strings.Join(tags, ", "))
			}
		}
	}
	if err != nil {
		utils.LogError(err.Error())
	}
	return found, err
}
