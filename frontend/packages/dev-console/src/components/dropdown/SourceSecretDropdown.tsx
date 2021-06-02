import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Firehose } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { ResourceDropdown } from '@console/shared';

interface SourceSecretDropdownProps {
  dropDownClassName?: string;
  menuClassName?: string;
  namespace?: string;
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  selectedKey: string;
  onChange?: (key: string) => void;
  title?: React.ReactNode;
}

const SourceSecretDropdown: React.FC<SourceSecretDropdownProps> = (props) => {
  const { t } = useTranslation();
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
        placeholder={t('devconsole~Select Secret name')}
        resourceFilter={filterData}
        dataSelector={['metadata', 'name']}
      />
    </Firehose>
  );
};

export default SourceSecretDropdown;
