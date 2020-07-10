import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { PodModel, JobModel, CronJobModel } from '@console/internal/models';
import { ResourceDropdown } from '@console/shared';
import {
  getDynamicChannelResourceList,
  getDynamicEventSourcesResourceList,
} from '@console/knative-plugin/src/utils/fetch-dynamic-eventsources-utils';
import { knativeEventingResourcesBroker } from '@console/knative-plugin/src/utils/get-knative-resources';

interface ApplicationDropdownProps {
  id?: string;
  className?: string;
  dropDownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  title?: React.ReactNode;
  titlePrefix?: string;
  allApplicationsKey?: string;
  storageKey?: string;
  disabled?: boolean;
  allSelectorItem?: {
    allSelectorKey?: string;
    allSelectorTitle?: string;
  };
  namespace?: string;
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  selectedKey: string;
  autoSelect?: boolean;
  onChange?: (key: string, name?: string) => void;
  onLoad?: (items: { [key: string]: string }) => void;
}

const ApplicationDropdown: React.FC<ApplicationDropdownProps> = ({ namespace, ...props }) => {
  const resources = [
    {
      isList: true,
      namespace,
      kind: 'DeploymentConfig',
      prop: 'deploymentConfigs',
    },
    {
      isList: true,
      namespace,
      kind: 'Deployment',
      prop: 'deployments',
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
    },
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'knativeService',
      optional: true,
    },
    {
      isList: true,
      kind: 'Secret',
      namespace,
      prop: 'secrets',
    },
    {
      isList: true,
      kind: VirtualMachineModel.kind,
      namespace,
      prop: 'virtualMachines',
      optional: true,
    },
    {
      isList: true,
      kind: CronJobModel.kind,
      namespace,
      prop: 'cronjobs',
      optional: true,
    },
    {
      isList: true,
      kind: JobModel.kind,
      namespace,
      prop: 'jobs',
      optional: true,
    },
    {
      isList: true,
      kind: PodModel.kind,
      namespace,
      prop: 'pods',
      optional: true,
    },
    ...getDynamicChannelResourceList(namespace),
    ...getDynamicEventSourcesResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];
  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        placeholder="Select an Application"
        dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
      />
    </Firehose>
  );
};

export default ApplicationDropdown;
