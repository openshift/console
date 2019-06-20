import * as React from 'react';
import { SecretModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils';
import ResourceDropdown from './ResourceDropdown';

interface SourceSecretDropdownProps {
  dropDownClassName?: string;
  menuClassName?: string;
  namespace?: string;
  actionItem?: {
    actionTitle: string;
    actionKey: string;
  };
  selectedKey: string;
  onChange?: (name: string, key: string) => void;
}

const SourceSecretDropdown: React.FC<SourceSecretDropdownProps> = (props) => {
  const filterData = (item) => {
    return item.type === 'kubernetes.io/basic-auth' || item.type === 'kubernetes.io/ssh-auth';
  };
  const resources = [
    {
      isList: true,
      namespace: props.namespace,
      kind: SecretModel.kind,
      prop: 'secrets',
    },
  ];
  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        placeholder="Select Secret Name"
        resourceFilter={filterData}
        dataSelector={['metadata', 'name']}
      />
    </Firehose>
  );
};

export default SourceSecretDropdown;
