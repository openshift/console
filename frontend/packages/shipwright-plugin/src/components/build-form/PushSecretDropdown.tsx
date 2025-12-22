import type { ReactNode, FC } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { Firehose } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import {
  ResourceDropdown,
  ResourceDropdownProps,
} from '@console/shared/src/components/dropdown/ResourceDropdown';

interface PushSecretDropdownProps
  extends Omit<
    ResourceDropdownProps,
    'dataSelector' | 'placeholder' | 'autocompleteFilter' | 'resourceFilter' | 'showBadge'
  > {
  namespace?: string;
  onChange?: (key: string) => void;
  title?: ReactNode;
  name: string;
}

const PushSecretDropdown: FC<PushSecretDropdownProps> = (props) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const filterData = (item) => {
    return (
      item.type === 'kubernetes.io/dockercfg' || item.type === 'kubernetes.io/dockerconfigjson'
    );
  };
  const resources = [
    {
      isList: true,
      kind: SecretModel.kind,
      namespace: props.namespace,
      prop: SecretModel.id,
      optional: true,
    },
  ];
  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        dataSelector={['metadata', 'name']}
        placeholder={t('shipwright-plugin~Select a Secret')}
        autocompleteFilter={autocompleteFilter}
        resourceFilter={filterData}
        showBadge
      />
    </Firehose>
  );
};

export default PushSecretDropdown;
