import type { FC } from 'react';
import { List } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import ConfigurationsOverviewListItem from './ConfigurationsOverviewListItem';

type ConfigurationsOverviewListProps = {
  configurations: K8sResourceKind[];
};

const ConfigurationsOverviewList: FC<ConfigurationsOverviewListProps> = ({ configurations }) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <>
      <SidebarSectionHeading text={t('Configurations')} />
      {_.isEmpty(configurations) ? (
        <span className="pf-v6-u-text-color-subtle">
          {t('No configurations found for this resource.')}
        </span>
      ) : (
        <List isPlain isBordered>
          {_.map(configurations, (configuration) => (
            <ConfigurationsOverviewListItem
              key={configuration.metadata.uid}
              configuration={configuration}
            />
          ))}
        </List>
      )}
    </>
  );
};

export default ConfigurationsOverviewList;
