#!/bin/bash

export ON_CI="ON_CI"

# -----------------
# Install HCO (kubevirt and helper operators)

# Note: installing main brance is dangerous, we may want to look into a better way. 
HCO_VERSION="master"

curl https://raw.githubusercontent.com/kubevirt/hyperconverged-cluster-operator/$HCO_VERSION/deploy/deploy.sh | bash

# Wait for kubevirt to be available
oc -n kubevirt-hyperconverged wait deployment/virt-operator --for=condition=Available --timeout="300s"

# -----------------
# Create storage class and storage namespace for testing

# Create openshift-cnv namespace for Integration Tests
oc create namespace openshift-cnv

# Setup storage
oc create -f https://raw.githubusercontent.com/openshift/console/master/frontend/packages/kubevirt-plugin/integration-tests/ci-scripts/hostpath-provisioner-setup.yml

oc patch storageclass hostpath -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'

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

# -----------------
# Download virtctl tool if needed

if ! type virtctl; then
  # Get lataset working kubevirt version by runing:
  # echo $(curl -s https://github.com/kubevirt/kubevirt/releases/latest | grep -o "v[0-9]\.[0-9]*\.[0-9]*")
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

# -----------------
# Anotate Templates for downstream testing

num_of_lines=0

# Wait for templates to be created before continuing
while [ "$num_of_lines" -eq 0 ]
do
  echo "Waiting for creation of common templates"
  num_of_lines=$(oc get -n openshift templates | grep windows10-desktop-large | wc -l)
done

echo "Common templates created"

# Pause the SSP operator to prevent overwrites
oc annotate -n kubevirt-hyperconverged deployments ssp-operator kubevirt.io/operator.paused="true"

# Annotate templates
curl https://raw.githubusercontent.com/openshift/console/master/frontend/packages/kubevirt-plugin/integration-tests/ci-scripts/add-support-annotations.sh | bash

# Unpause the SSP operator
oc annotate -n kubevirt-hyperconverged deployments ssp-operator kubevirt.io/operator.paused-
