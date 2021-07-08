import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import ConfigurationsOverviewListItem from './ConfigurationsOverviewListItem';

export type ConfigurationsOverviewListProps = {
  configurations: K8sResourceKind[];
};

const ConfigurationsOverviewList: React.FC<ConfigurationsOverviewListProps> = ({
  configurations,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Configurations')} />
      {_.isEmpty(configurations) ? (
        <span className="text-muted">
          {t('knative-plugin~No configurations found for this resource.')}
        </span>
      ) : (
        <ul className="list-group">
          {_.map(configurations, (configuration) => (
            <ConfigurationsOverviewListItem
              key={configuration.metadata.uid}
              configuration={configuration}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export default ConfigurationsOverviewList;
