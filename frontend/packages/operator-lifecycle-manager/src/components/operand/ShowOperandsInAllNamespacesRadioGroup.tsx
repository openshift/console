import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup } from '@console/internal/components/radio';
import { useShowOperandsInAllNamespaces } from './useShowOperandsInAllNamespaces';

export const ShowOperandsInAllNamespacesRadioGroup: React.FC = () => {
  const { t } = useTranslation();
  const [
    showOperandsInAllNamespaces,
    setShowOperandsInAllNamespaces,
  ] = useShowOperandsInAllNamespaces();
  return (
    <RadioGroup
      label={t('olm~Show operands in:')}
      currentValue={showOperandsInAllNamespaces ? 'true' : 'false'}
      inline
      items={[
        {
          value: 'true',
          title: t('olm~All namespaces'),
        },
        {
          value: 'false',
          title: t('olm~Current namespace only'),
        },
      ]}
      onChange={({ currentTarget }) =>
        setShowOperandsInAllNamespaces(currentTarget.value === 'true')
      }
    />
  );
};
