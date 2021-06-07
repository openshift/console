
#!/bin/bash

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
