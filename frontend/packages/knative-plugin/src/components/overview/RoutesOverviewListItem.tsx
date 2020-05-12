import * as React from 'react';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { RouteModel } from '../../models';
import { RoutesOverviewListItem } from '../../types';

export type RoutesOverviewListItemProps = {
  routeLink: RoutesOverviewListItem;
};

const RoutesOverviewListItem: React.FC<RoutesOverviewListItemProps> = ({
  routeLink: { url, name, namespace, percent },
}) => (
  <li className="list-group-item">
    <div className="row">
      <div className="col-xs-10">
        <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
        {url.length > 0 && (
          <>
            <span className="text-muted">Location: </span>
            <ExternalLink href={url} additionalClassName="co-external-link--block" text={url} />
          </>
        )}
      </div>
      {percent.length > 0 && <span className="col-xs-2 text-right">{percent}</span>}
    </div>
  </li>
);

export default RoutesOverviewListItem;
