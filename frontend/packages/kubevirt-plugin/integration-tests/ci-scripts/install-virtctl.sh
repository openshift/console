#!/bin/bash

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
