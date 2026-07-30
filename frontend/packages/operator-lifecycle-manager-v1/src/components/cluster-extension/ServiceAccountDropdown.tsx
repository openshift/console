import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { ListDropdownProps } from '@console/internal/components/utils/list-dropdown';
import { ListDropdown } from '@console/internal/components/utils/list-dropdown';
import { ServiceAccountModel } from '@console/internal/models';
import { useCreateServiceAccountModal } from '../../hooks/useCreateServiceAccountModal';

interface ServiceAccountDropdownProps {
  namespace: string;
  selectedKey: string;
  onChange: (value: string) => void;
  id: string;
}

export const ServiceAccountDropdown: FC<ServiceAccountDropdownProps> = ({
  namespace,
  selectedKey,
  onChange,
  id,
}) => {
  const { t } = useTranslation('olm-v1');
  const createServiceAccountModal = useCreateServiceAccountModal();

  const actionItems = namespace
    ? [
        {
          actionTitle: t('Create ServiceAccount'),
          actionKey: 'Create_ServiceAccount',
        },
      ]
    : [];

  const handleOnChange: ListDropdownProps['onChange'] = (actionKey, _kindLabel, resource) => {
    switch (actionKey) {
      case 'Create_ServiceAccount': {
        createServiceAccountModal({
          namespace,
          initialName: selectedKey,
          onSubmit: (newServiceAccount) => {
            onChange(newServiceAccount.metadata.name);
          },
        });
        break;
      }
      default: {
        // When selecting an existing resource, use the resource object if available
        const selectedName = resource?.metadata?.name || actionKey;
        onChange(selectedName);
        break;
      }
    }
  };

  return (
    <ListDropdown
      id={id}
      resources={
        namespace
          ? [
              {
                kind: ServiceAccountModel.kind,
                namespace,
                isList: true,
              },
            ]
          : []
      }
      desc={ServiceAccountModel.label}
      placeholder={t('Select service account')}
      selectedKey={selectedKey}
      selectedKeyKind={ServiceAccountModel.kind}
      onChange={handleOnChange}
      actionItems={actionItems}
    />
  );
};
