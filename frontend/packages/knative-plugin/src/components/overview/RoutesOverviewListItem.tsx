import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';
import { RoutesOverviewListItem } from '../../types';
import RoutesUrlLink from './RoutesUrlLink';

export type RoutesOverviewListItemProps = {
  routeLink: RoutesOverviewListItem;
  uniqueRoutes?: string[];
  totalPercent?: string;
};

const RoutesOverviewListItem: React.FC<RoutesOverviewListItemProps> = ({
  routeLink: { url, name, namespace, percent },
  totalPercent,
  uniqueRoutes,
}) => {
  const { t } = useTranslation();
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-xs-10">
          <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
          {url.length > 0 && <RoutesUrlLink urls={[url]} title={t('knative-plugin~Location')} />}
          {uniqueRoutes?.length > 0 && (
            <RoutesUrlLink urls={uniqueRoutes} title={t('knative-plugin~Unique Route')} />
          )}
        </div>
        {percent.length > 0 && (
          <span className="col-xs-2 text-right">{totalPercent || percent}</span>
        )}
      </div>
    </li>
  );
};

export default RoutesOverviewListItem;
