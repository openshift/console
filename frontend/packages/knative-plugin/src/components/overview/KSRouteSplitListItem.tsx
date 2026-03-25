import type { FC } from 'react';
import { Grid, GridItem, ListItem } from '@patternfly/react-core';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import type { RoutesOverviewListItem } from '../../types';
import './KSRouteSplitListItem.scss';

type KSRouteSplitListItemProps = {
  route: RoutesOverviewListItem;
};

const KSRouteSplitListItem: FC<KSRouteSplitListItemProps> = ({ route: { percent, url } }) =>
  url.length > 0 && percent.length > 0 ? (
    <ListItem>
      <div className="odc-ksroute-split-list-item">
        <Grid hasGutter>
          <GridItem span={10}>
            <span>
              {`${percent} → `}
              <ExternalLink href={url} displayBlock text={url} />
            </span>
          </GridItem>
        </Grid>
      </div>
    </ListItem>
  ) : null;

export default KSRouteSplitListItem;
