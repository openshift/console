import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Firehose } from '@console/internal/components/utils/firehose';
import { SecretModel } from '@console/internal/models';
import type { ResourceDropdownProps } from '@console/shared/src/components/dropdown/ResourceDropdown';
import { ResourceDropdown } from '@console/shared/src/components/dropdown/ResourceDropdown';

interface SourceSecretDropdownProps
  extends Omit<ResourceDropdownProps, 'resources' | 'placeholder' | 'dataSelector'> {
  namespace?: string;
}

const SourceSecretDropdown: FC<SourceSecretDropdownProps> = (props) => {
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
