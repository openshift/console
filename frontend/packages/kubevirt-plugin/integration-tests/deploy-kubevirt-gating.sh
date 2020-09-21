export KUBEVIRT_VERSION=$(curl -s https://github.com/kubevirt/kubevirt/releases/latest | grep -o "v[0-9]\.[0-9]*\.[0-9]*")
export CDI_VERSION=$(curl -s https://github.com/kubevirt/containerized-data-importer/releases/latest | grep -o "v[0-9]\.[0-9]*\.[0-9]*")

# Create openshift-cnv namespace for Integration Tests
oc create namespace openshift-cnv

# Deploy Kubevirt, Storage, CDI Pods
oc create -f https://github.com/kubevirt/kubevirt/releases/download/$KUBEVIRT_VERSION/kubevirt-operator.yaml

oc create -f https://github.com/kubevirt/kubevirt/releases/download/$KUBEVIRT_VERSION/kubevirt-cr.yaml

oc create -f https://raw.githubusercontent.com/kubevirt/kubevirt.github.io/master/labs/manifests/storage-setup.yml

oc create -f https://github.com/kubevirt/containerized-data-importer/releases/download/$CDI_VERSION/cdi-operator.yaml

oc create -f https://github.com/kubevirt/containerized-data-importer/releases/download/$CDI_VERSION/cdi-cr.yaml

# Deploy Common Templates
oc project openshift
oc create -f https://raw.githubusercontent.com/MarSik/kubevirt-ssp-operator/master/roles/KubevirtCommonTemplatesBundle/files/common-templates-v0.12.1.yaml
oc project default

# Wait for kubevirt to be available
oc wait -n kubevirt kv kubevirt --for condition=Available --timeout 15m

# Create storage-class permissions
oc create -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubevirt-storage-class-defaults
  namespace: openshift-cnv
data:
  accessMode: ReadWriteOnce
  volumeMode: Filesystem
EOF

# Enable live-migration feature-gate
oc create -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubevirt-config
  namespace: kubevirt-hyperconverged
  labels:
  kubevirt.io: ""
data:
  feature-gates: "LiveMigration"
EOF
