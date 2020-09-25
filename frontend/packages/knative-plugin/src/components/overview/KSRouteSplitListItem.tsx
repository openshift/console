import * as React from 'react';
import { ExternalLink } from '@console/internal/components/utils';
import { RoutesOverviewListItem } from '../../types';
import './KSRouteSplitListItem.scss';

type KSRouteSplitListItemProps = {
  route: RoutesOverviewListItem;
};

const KSRouteSplitListItem: React.FC<KSRouteSplitListItemProps> = ({ route: { percent, url } }) =>
  url.length > 0 && percent.length > 0 ? (
    <li className="list-group-item">
      <div className="odc-ksroute-split-list-item">
        <div className="row">
          <div className="col-xs-10">
            <span>
              {`${percent} → `}
              <ExternalLink href={url} additionalClassName="co-external-link--block" text={url} />
            </span>
          </div>
        </div>
      </div>
    </li>
  ) : null;

export default KSRouteSplitListItem;
