import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import ResourceDropdown from './ResourceDropdown';

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
  actionItem?: {
    actionTitle: string;
    actionKey: string;
  };
  selectedKey: string;
  onChange?: (key: string, name?: string) => void;
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
