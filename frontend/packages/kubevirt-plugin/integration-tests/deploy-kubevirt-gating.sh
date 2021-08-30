#!/bin/bash

export ON_CI="ON_CI"

TEMPLATES=(
  'rhel7-desktop-tiny'
  'rhel7-desktop-small'
  'rhel7-desktop-medium'
  'rhel7-desktop-large'
  'rhel7-server-tiny'
  'rhel7-server-small'
  'rhel7-server-medium'
  'rhel7-server-large'
  'rhel7-highperformance-tiny'
  'rhel7-highperformance-small'
  'rhel7-highperformance-medium'
  'rhel7-highperformance-large'
  'rhel8-desktop-tiny'
  'rhel8-desktop-small'
  'rhel8-desktop-medium'
  'rhel8-desktop-large'
  'rhel8-server-tiny'
  'rhel8-server-small'
  'rhel8-server-medium'
  'rhel8-server-large'
  'rhel8-highperformance-tiny'
  'rhel8-highperformance-small'
  'rhel8-highperformance-medium'
  'rhel8-highperformance-large'
  'windows2k12r2-server-medium'
  'windows2k12r2-server-large'
  'windows2k16-server-medium'
  'windows2k16-server-large'
  'windows2k19-server-medium'
  'windows2k19-server-large'
  'windows10-desktop-medium'
  'windows10-desktop-large'
)

ANNOTATIONS=(
  template.kubevirt.io/provider='Red Hat'
  template.kubevirt.io/provider-url='https://www.redhat.com'
  template.kubevirt.io/provider-support-level=Full
)

# Wait until master and worker MCP are updated
# or timeout after 90min.
wait_mcp_for_updated()
{
    local mcp_updated="false"

    sleep 30

    for i in {1..60}
    do
      echo "Attempt ${i}/60"
      sleep 30
      if oc wait mcp master worker --for condition=updated --timeout=1m; then
        echo "MCP is updated"
        mcp_updated="true"
        break
      fi
    done

    if [[ "$mcp_updated" == "false" ]]; then
      echo "Error: MCP didn't get updated!!"
      exit 1
    fi
}

# ----------------------------------------------------------------------------------------------------
# Install HCO (kubevirt and helper operators)

export HOC_IMAGE_VER=1.5.0-unstable
export HCO_SUBSCRIPTION_CHANNEL="1.5.0"

cat <<EOF | oc apply -f -
apiVersion: operators.coreos.com/v1alpha1
kind: CatalogSource
metadata:
  name: hco-unstable-catalog-source
  namespace: openshift-marketplace
spec:
  sourceType: grpc
  image: quay.io/kubevirt/hyperconverged-cluster-index:${HOC_IMAGE_VER}
  displayName: Kubevirt Hyperconverged Cluster Operator
  publisher: Kubevirt Project
EOF

cat <<EOF | oc apply -f -
apiVersion: v1
kind: Namespace
metadata:
    name: kubevirt-hyperconverged
---
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
    name: kubevirt-hyperconverged-group
    namespace: kubevirt-hyperconverged
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
    name: hco-operatorhub
    namespace: kubevirt-hyperconverged
spec:
    source: hco-unstable-catalog-source
    sourceNamespace: openshift-marketplace
    name: community-kubevirt-hyperconverged
    channel: ${HCO_SUBSCRIPTION_CHANNEL}
EOF

# Wait for HCO cr to be created
sleep 60

for i in {1..20}
do
  echo "Attempt ${i}/20"
  if oc create -f https://raw.githubusercontent.com/kubevirt/hyperconverged-cluster-operator/main/deploy/hco.cr.yaml -n kubevirt-hyperconverged; then
    echo "HCO cr is created"
    break
  fi
  sleep 30
done

# Wait for kubevirt virt-operator to be available
sleep 60

for i in {1..20}
do
  echo "Attempt ${i}/20"
  if oc -n kubevirt-hyperconverged wait deployment/virt-operator --for=condition=Available --timeout="10m"; then
    echo "virt-operator is Available"
    break
  fi
  sleep 30
done

# ----------------------------------------------------------------------------------------------------
# Create storage class and storage namespace for testing
# Install HPP

export HPP_VERSION="release-v0.8"

# Configure SELinux when using OpenShift to allow HPP to create storage on workers
oc create -f \
  https://raw.githubusercontent.com/kubevirt/hostpath-provisioner-operator/${HPP_VERSION}/contrib/machineconfig-selinux-hpp.yaml

wait_mcp_for_updated

oc create -f \
  https://raw.githubusercontent.com/kubevirt/hostpath-provisioner-operator/${HPP_VERSION}/deploy/hostpathprovisioner_cr.yaml
oc create -f \
  https://raw.githubusercontent.com/kubevirt/hostpath-provisioner-operator/${HPP_VERSION}/deploy/storageclass-wffc.yaml

# Set HPP as default StorageClass for the cluster
oc annotate storageclasses --all storageclass.kubernetes.io/is-default-class-
oc annotate storageclass hostpath-provisioner storageclass.kubernetes.io/is-default-class='true'

# ----------------------------------------------------------------------------------------------------
# Download virtctl tool if needed

if ! type virtctl; then
  KUBEVIRT_VERSION="v0.41.0"
  VIRTCTL_DOWNLOAD_URL="https://github.com/kubevirt/kubevirt/releases/download/${KUBEVIRT_VERSION}/virtctl-${KUBEVIRT_VERSION}"
  VIRTCTL_X86_64="${VIRTCTL_DOWNLOAD_URL}-linux-x86_64"
  VIRTCTL_AMD64="${VIRTCTL_DOWNLOAD_URL}-linux-amd64"

  # Install virtctl binary and add to PATH
  mkdir virtctl

  wget ${VIRTCTL_AMD64} -O virtctl/virtctl || wget ${VIRTCTL_X86_64} -O virtctl/virtctl
  [[ ! -f "virtctl/virtctl" ]] && echo "ERROR: virtctl binary is unavailable for download" && exit 1

  chmod +x virtctl/virtctl

  export PATH="${PATH}:$(pwd)/virtctl"
fi

# ----------------------------------------------------------------------------------------------------
# Annotate templates for "downstream-like" environment

# Wait for templates to be created before continuing
num_of_lines=0
while [ "$num_of_lines" -eq 0 ]
do
  echo "Waiting for creation of common templates"
  num_of_lines=$(oc get -n openshift templates | grep windows10-desktop-large | wc -l)
done

echo "Common templates created"

# Pause the SSP operator to prevent overwrites
oc annotate -n kubevirt-hyperconverged deployments ssp-operator kubevirt.io/operator.paused="true"

# Annotate templates
for template in "${TEMPLATES[@]}"; do
    for annotation in "${ANNOTATIONS[@]}"; do
        oc annotate --overwrite -n openshift templates "${template}" "${annotation}"
    done
done

# Unpause the SSP operator
oc annotate -n kubevirt-hyperconverged deployments ssp-operator kubevirt.io/operator.paused-

# ----------------------------------------------------------------------------------------------------
# Create openshift-cnv namespace for integration tests
# FIXME: the tests should not need this namespace, we need to fix the tests that check for it

# Create the namespace
oc create namespace openshift-cnv

# Create config map for openshift-cnv
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
