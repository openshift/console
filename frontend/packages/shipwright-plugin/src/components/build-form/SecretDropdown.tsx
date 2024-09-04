import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { SecretModel } from '@console/internal/models';
import { ResourceDropdownField } from '@console/shared';

interface SecretDropdownProps {
  name: string;
  namespace: string;
}

const SecretDropdown: React.FC<SecretDropdownProps> = ({ name, namespace }) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const resources = [
    {
      isList: true,
      kind: SecretModel.kind,
      namespace,
      prop: SecretModel.id,
      optional: true,
    },
  ];
  return (
    <ResourceDropdownField
      name={name}
      resources={resources}
      dataSelector={['metadata', 'name']}
      placeholder={t('shipwright-plugin~Select a Secret')}
      autocompleteFilter={autocompleteFilter}
      fullWidth
      showBadge
    />
  );
};

export default SecretDropdown;
