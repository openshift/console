import * as React from 'react';
import { ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel } from '../../models';

export type ConfigurationsOverviewListItemProps = {
  configuration: K8sResourceKind;
};

const ConfigurationsOverviewListItem: React.FC<ConfigurationsOverviewListItemProps> = ({
  configuration: {
    metadata: { name, namespace } = { name: '', namespace: '' },
    status: { latestCreatedRevisionName, latestReadyRevisionName } = {
      latestCreatedRevisionName: '',
      latestReadyRevisionName: '',
    },
  },
}) => {
  const { t } = useTranslation();
  return (
    <ListItem>
      <ResourceLink
        kind={referenceForModel(ConfigurationModel)}
        name={name}
        namespace={namespace}
      />
      <span className="pf-v6-u-text-color-subtle">
        {t('knative-plugin~Latest created Revision name:')}{' '}
      </span>
      <span>{latestCreatedRevisionName}</span>
      <br />
      <span className="pf-v6-u-text-color-subtle">
        {t('knative-plugin~Latest ready Revision name:')}{' '}
      </span>
      <span>{latestReadyRevisionName}</span>
    </ListItem>
  );
};
export default ConfigurationsOverviewListItem;
