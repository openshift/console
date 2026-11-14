package actions

import (
	"context"
	"fmt"
	"strconv"

	"helm.sh/helm/v4/pkg/action"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	"helm.sh/helm/v4/pkg/kube"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

// ListReleases returns the latest revision of every Helm release in ns (all
// namespaces when ns is empty), like `helm list --all`.
//
// Helm's Secrets driver decodes every release Secret (base64, gzip, JSON with
// manifests and chart files) before action.List keeps only the latest revision
// of each release. Most Secrets on a busy cluster are superseded revisions, so
// when the release store is the Secrets driver, list through
// latestRevisionSecrets instead: it never fetches superseded Secrets and drops
// older revisions by their labels, so only one Secret per release is decoded.
func ListReleases(conf *action.Configuration, ns string, limitInfo bool) ([]*releasev1.Release, error) {
	if _, ok := conf.Releases.Driver.(*driver.Secrets); ok {
		clientset, err := conf.KubernetesClientSet()
		if err != nil {
			return nil, err
		}
		conf = latestRevisionConfig(conf.KubeClient, clientset.CoreV1().Secrets(ns))
	}
	return listReleases(conf, limitInfo)
}

// latestRevisionConfig returns an action configuration whose release store
// reads secrets through latestRevisionSecrets. It is only fit for listing.
func latestRevisionConfig(kubeClient kube.Interface, secrets corev1client.SecretInterface) *action.Configuration {
	conf := action.NewConfiguration()
	conf.KubeClient = kubeClient
	conf.Releases = storage.Init(driver.NewSecrets(latestRevisionSecrets{secrets}))
	return conf
}

func listReleases(conf *action.Configuration, limitInfo bool) ([]*releasev1.Release, error) {
	cmd := action.NewList(conf)
	cmd.StateMask = action.ListAll
	results, err := cmd.Run()
	if err != nil {
		return nil, err
	}
	if results == nil {
		return make([]*releasev1.Release, 0), nil
	}

	releases := make([]*releasev1.Release, 0, len(results))
	for _, r := range results {
		rel, ok := r.(*releasev1.Release)
		if !ok {
			return nil, fmt.Errorf("unexpected release type %T", r)
		}
		releases = append(releases, rel)
	}

	if limitInfo {
		limited := make([]*releasev1.Release, 0, len(releases))
		for _, rel := range releases {
			info := releasev1.Release{
				Name:      rel.Name,
				Version:   rel.Version,
				Namespace: rel.Namespace,
				Info:      rel.Info,
			}
			if rel.Chart != nil {
				info.Chart = &chart.Chart{
					Metadata: rel.Chart.Metadata,
				}
			}
			limited = append(limited, &info)
		}
		return limited, nil
	}
	return releases, nil
}

// latestRevisionSecrets narrows List calls made by Helm's Secrets driver to the
// Secrets action.List can return, so the driver doesn't decode the rest:
//
//   - The API server filters out superseded revisions (status!=superseded).
//     Helm marks a revision superseded only once a newer revision replaces it,
//     so the latest revision of a release is never superseded.
//   - Of the remaining revisions of each release (for example an old failed
//     upgrade), only the highest "version" label is kept, which is the one
//     action.List would keep after decoding. Secrets without parseable "name"
//     and "version" labels are kept and left to action.List.
type latestRevisionSecrets struct {
	corev1client.SecretInterface
}

func (s latestRevisionSecrets) List(ctx context.Context, opts metav1.ListOptions) (*corev1.SecretList, error) {
	selector, err := labels.Parse(opts.LabelSelector)
	if err != nil {
		return nil, err
	}
	notSuperseded, err := labels.NewRequirement("status", selection.NotEquals, []string{"superseded"})
	if err != nil {
		return nil, err
	}
	opts.LabelSelector = selector.Add(*notSuperseded).String()

	list, err := s.SecretInterface.List(ctx, opts)
	if err != nil {
		return nil, err
	}
	list.Items = latestRevisions(list.Items)
	return list, nil
}

type releaseKey struct{ namespace, name string }

// latestRevisions keeps, for each release, only the Secret with the highest
// "version" label. Order is preserved.
func latestRevisions(secrets []corev1.Secret) []corev1.Secret {
	revision := func(s *corev1.Secret) (releaseKey, int, bool) {
		name, ok := s.Labels["name"]
		if !ok {
			return releaseKey{}, 0, false
		}
		version, err := strconv.Atoi(s.Labels["version"])
		if err != nil {
			return releaseKey{}, 0, false
		}
		return releaseKey{s.Namespace, name}, version, true
	}

	latest := make(map[releaseKey]int)
	for i := range secrets {
		if key, version, ok := revision(&secrets[i]); ok {
			if current, seen := latest[key]; !seen || version > current {
				latest[key] = version
			}
		}
	}

	kept := secrets[:0]
	for i := range secrets {
		if key, version, ok := revision(&secrets[i]); ok && version < latest[key] {
			continue
		}
		kept = append(kept, secrets[i])
	}
	return kept
}
