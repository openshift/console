import type { FC } from 'react';
import { ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel } from '../../models';

type ConfigurationsOverviewListItemProps = {
  configuration: K8sResourceKind;
};

const ConfigurationsOverviewListItem: FC<ConfigurationsOverviewListItemProps> = ({
  configuration: {
    metadata: { name, namespace },
    status: { latestCreatedRevisionName, latestReadyRevisionName },
  },
}) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <ListItem>
      <ResourceLink
        kind={referenceForModel(ConfigurationModel)}
        name={name}
        namespace={namespace}
      />
      <span className="pf-v6-u-text-color-subtle">{t('Latest created Revision name:')} </span>
      <span>{latestCreatedRevisionName}</span>
      <br />
      <span className="pf-v6-u-text-color-subtle">{t('Latest ready Revision name:')} </span>
      <span>{latestReadyRevisionName}</span>
    </ListItem>
  );
};
export default ConfigurationsOverviewListItem;
