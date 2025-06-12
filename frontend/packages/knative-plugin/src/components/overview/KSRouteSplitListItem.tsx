import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { RoutesOverviewListItem } from '../../types';
import './KSRouteSplitListItem.scss';

type KSRouteSplitListItemProps = {
  route: RoutesOverviewListItem;
};

const KSRouteSplitListItem: React.FC<KSRouteSplitListItemProps> = ({ route: { percent, url } }) =>
  url.length > 0 && percent.length > 0 ? (
    <li className="list-group-item">
      <div className="odc-ksroute-split-list-item">
        <Grid hasGutter>
          <GridItem span={10}>
            <span>
              {`${percent} → `}
              <ExternalLink href={url} additionalClassName="pf-v6-u-display-block" text={url} />
            </span>
          </GridItem>
        </Grid>
      </div>
    </li>
  ) : null;

export default KSRouteSplitListItem;
