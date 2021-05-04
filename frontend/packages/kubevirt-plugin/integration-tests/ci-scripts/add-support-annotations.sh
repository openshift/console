#!/bin/bash

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

IFS=""

for template in "${TEMPLATES[@]}"; do
    for annotation in "${ANNOTATIONS[@]}"; do
        oc annotate --overwrite -n openshift templates "${template}" "${annotation}"
    done
done
