import type { FC } from 'react';
import { Form } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import ClusterConfigurationField from './ClusterConfigurationField';
import type { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationFormProps = {
  items?: ResolvedClusterConfigurationItem[];
};

const ClusterConfigurationForm: FC<ClusterConfigurationFormProps> = ({ items }) => {
  const { t } = useTranslation('console-app');

  if (!items?.length) {
    return null;
  }

  return (
    <Form aria-label={t('Cluster configuration')} onSubmit={(event) => event.preventDefault()}>
      {items.map((item) => (
        <ClusterConfigurationField key={item.id} item={item} />
      ))}
    </Form>
  );
};
export default ClusterConfigurationForm;
