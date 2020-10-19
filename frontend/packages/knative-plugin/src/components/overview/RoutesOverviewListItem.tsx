import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
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
}) => (
  <li className="list-group-item">
    <div className="row">
      <div className="col-xs-10">
        <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
        {url.length > 0 && <RoutesUrlLink urls={[url]} title="Location" />}
        {uniqueRoutes?.length > 0 && <RoutesUrlLink urls={uniqueRoutes} title="Unique Route" />}
      </div>
      {percent.length > 0 && <span className="col-xs-2 text-right">{totalPercent || percent}</span>}
    </div>
  </li>
);

export default RoutesOverviewListItem;
