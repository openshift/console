package actions

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"reflect"
	"slices"
	"sort"
	"testing"

	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	releasecommon "helm.sh/helm/v4/pkg/release/common"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
	"time"
)

func TestListReleases(t *testing.T) {
	tests := []struct {
		name    string
		release releasev1.Release
	}{
		{
			name: "list valid releases",
			release: releasev1.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &releasev1.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:    "influxdb",
						Version: "3.0.2",
					},
				},
			},
		},
	}
	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			// create fake release
			err := store.Create(&tt.release)
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
			}
			rels, err := ListReleases(actionConfig, "", true)
			if err != nil {
				t.Error("Error occurred while installing chartPath")
			}
			if len(rels) <= 0 {
				t.Error("Release list should contain 1 release")
			}
			if rels[0].Name != "test" {
				t.Error("Release name isn't matching")
			}
			if rels[0].Namespace != "test-namespace" {
				t.Error("Namespace isn't matching")
			}
			if rels[0].Info.Status != releasecommon.StatusDeployed {
				t.Error("Chart status should be deployed")
			}
			if rels[0].Chart.Metadata.Name != "influxdb" {
				t.Error("Chart name mismatch")
			}
			if rels[0].Chart.Metadata.Version != "3.0.2" {
				t.Error("Chart version mismatch")
			}
		})
	}
}

type fixtureRevision struct {
	namespace, name string
	version         int
	status          releasecommon.Status
}

// listFixture covers the statuses action.List with ListAll distinguishes,
// including releases whose older revisions are not superseded.
var listFixture = []fixtureRevision{
	// Upgraded twice.
	{"ns1", "upgraded", 1, releasecommon.StatusSuperseded},
	{"ns1", "upgraded", 2, releasecommon.StatusSuperseded},
	{"ns1", "upgraded", 3, releasecommon.StatusDeployed},
	// Same release name in another namespace.
	{"ns2", "upgraded", 1, releasecommon.StatusSuperseded},
	{"ns2", "upgraded", 2, releasecommon.StatusDeployed},
	// Failed upgrade: the previous revision stays deployed.
	{"ns1", "failed-upgrade", 1, releasecommon.StatusDeployed},
	{"ns1", "failed-upgrade", 2, releasecommon.StatusFailed},
	// An old failed revision survives later upgrades.
	{"ns2", "old-failure", 1, releasecommon.StatusFailed},
	{"ns2", "old-failure", 2, releasecommon.StatusSuperseded},
	{"ns2", "old-failure", 3, releasecommon.StatusDeployed},
	// Uninstalled with --keep-history.
	{"ns1", "kept-history", 1, releasecommon.StatusSuperseded},
	{"ns1", "kept-history", 2, releasecommon.StatusUninstalled},
	// Operations in progress.
	{"ns1", "uninstalling", 1, releasecommon.StatusUninstalling},
	{"ns2", "installing", 1, releasecommon.StatusPendingInstall},
	{"ns2", "upgrading", 1, releasecommon.StatusSuperseded},
	{"ns2", "upgrading", 2, releasecommon.StatusPendingUpgrade},
	{"ns2", "rolling-back", 1, releasecommon.StatusSuperseded},
	{"ns2", "rolling-back", 2, releasecommon.StatusSuperseded},
	{"ns2", "rolling-back", 3, releasecommon.StatusPendingRollback},
	// ListAll excludes "unknown", so this release is not listed at all.
	{"ns1", "unknown", 1, releasecommon.StatusDeployed},
	{"ns1", "unknown", 2, releasecommon.StatusUnknown},
}

func fixtureRelease(r fixtureRevision) *releasev1.Release {
	return &releasev1.Release{
		Name:      r.name,
		Namespace: r.namespace,
		Version:   r.version,
		Info: &releasev1.Info{
			Status:      r.status,
			Description: fmt.Sprintf("revision %d", r.version),
		},
		Chart: &chart.Chart{
			Metadata: &chart.Metadata{Name: "demo", Version: fmt.Sprintf("0.1.%d", r.version)},
		},
		Manifest: fmt.Sprintf("# manifest of revision %d", r.version),
	}
}

func secretKey(name string, version int) string {
	return fmt.Sprintf("sh.helm.release.v1.%s.v%d", name, version)
}

// newFixtureClient stores the fixture as Helm would, through Helm's own
// Secrets driver, so the Secrets carry Helm's labels and encoding.
func newFixtureClient(t *testing.T) *k8sfake.Clientset {
	t.Helper()
	client := k8sfake.NewClientset()
	for _, r := range listFixture {
		d := driver.NewSecrets(client.CoreV1().Secrets(r.namespace))
		if err := d.Create(secretKey(r.name, r.version), fixtureRelease(r)); err != nil {
			t.Fatal(err)
		}
	}
	return client
}

// corruptSuperseded replaces the payload of every superseded revision with a
// release that claims to be a newer, deployed revision. Decoding any of them
// would change what action.List returns.
func corruptSuperseded(t *testing.T, client *k8sfake.Clientset) {
	t.Helper()
	for _, r := range listFixture {
		if r.status != releasecommon.StatusSuperseded {
			continue
		}
		secrets := client.CoreV1().Secrets(r.namespace)
		key := secretKey(r.name, r.version)
		obj, err := secrets.Get(context.Background(), key, metav1.GetOptions{})
		if err != nil {
			t.Fatal(err)
		}
		impostor := fixtureRevision{r.namespace, r.name, 100 + r.version, releasecommon.StatusDeployed}
		scratch := k8sfake.NewClientset()
		if err := driver.NewSecrets(scratch.CoreV1().Secrets(r.namespace)).Create(key, fixtureRelease(impostor)); err != nil {
			t.Fatal(err)
		}
		encoded, err := scratch.CoreV1().Secrets(r.namespace).Get(context.Background(), key, metav1.GetOptions{})
		if err != nil {
			t.Fatal(err)
		}
		obj.Data = encoded.Data
		if _, err := secrets.Update(context.Background(), obj, metav1.UpdateOptions{}); err != nil {
			t.Fatal(err)
		}
	}
}

func plainSecretsConfig(secrets corev1client.SecretInterface) *action.Configuration {
	conf := action.NewConfiguration()
	conf.KubeClient = &kubefake.PrintingKubeClient{Out: io.Discard}
	conf.Releases = storage.Init(driver.NewSecrets(secrets))
	return conf
}

// releasesJSON serializes releases in a canonical order. action.List sorts by
// name only, so the order of equally named releases in different namespaces
// is not stable.
func releasesJSON(t *testing.T, rels []*releasev1.Release) string {
	t.Helper()
	sorted := slices.Clone(rels)
	sort.SliceStable(sorted, func(i, j int) bool {
		if sorted[i].Name != sorted[j].Name {
			return sorted[i].Name < sorted[j].Name
		}
		return sorted[i].Namespace < sorted[j].Namespace
	})
	out, err := json.Marshal(sorted)
	if err != nil {
		t.Fatal(err)
	}
	return string(out)
}

// The Secrets handed to Helm's driver, which decodes every one of them, are
// exactly the latest revision of each release.
func TestLatestRevisionSecretsSkipsSupersededAndOlderRevisions(t *testing.T) {
	client := newFixtureClient(t)
	list, err := latestRevisionSecrets{client.CoreV1().Secrets("")}.List(context.Background(),
		metav1.ListOptions{LabelSelector: "owner=helm"})
	if err != nil {
		t.Fatal(err)
	}
	var got []string
	for _, s := range list.Items {
		got = append(got, s.Namespace+"/"+s.Name)
	}
	sort.Strings(got)

	latest := map[string]fixtureRevision{}
	for _, r := range listFixture {
		k := r.namespace + "/" + r.name
		if cur, ok := latest[k]; !ok || r.version > cur.version {
			latest[k] = r
		}
	}
	var want []string
	for _, r := range latest {
		want = append(want, r.namespace+"/"+secretKey(r.name, r.version))
	}
	sort.Strings(want)

	if !reflect.DeepEqual(got, want) {
		t.Errorf("secrets passed to the decoder:\n got %v\nwant %v", got, want)
	}
}

// The new listing returns what Helm's action.List over all Secrets returned.
func TestListReleasesMatchesHelmList(t *testing.T) {
	for _, ns := range []string{"", "ns1", "ns2"} {
		for _, limitInfo := range []bool{true, false} {
			t.Run(fmt.Sprintf("ns=%q limitInfo=%v", ns, limitInfo), func(t *testing.T) {
				client := newFixtureClient(t)
				want, err := listReleases(plainSecretsConfig(client.CoreV1().Secrets(ns)), limitInfo)
				if err != nil {
					t.Fatal(err)
				}
				if len(want) == 0 {
					t.Fatal("fixture produced no releases")
				}

				corruptSuperseded(t, client)
				conf := latestRevisionConfig(&kubefake.PrintingKubeClient{Out: io.Discard}, client.CoreV1().Secrets(ns))
				got, err := listReleases(conf, limitInfo)
				if err != nil {
					t.Fatal(err)
				}
				if g, w := releasesJSON(t, got), releasesJSON(t, want); g != w {
					t.Errorf("releases differ from helm list:\n got %s\nwant %s", g, w)
				}

				// Sanity check: the corrupted superseded Secrets would have
				// changed the old listing.
				corrupted, err := listReleases(plainSecretsConfig(client.CoreV1().Secrets(ns)), limitInfo)
				if err != nil {
					t.Fatal(err)
				}
				if releasesJSON(t, corrupted) == releasesJSON(t, want) {
					t.Error("corrupting superseded Secrets did not affect helm list; the test proves nothing")
				}
			})
		}
	}
}
