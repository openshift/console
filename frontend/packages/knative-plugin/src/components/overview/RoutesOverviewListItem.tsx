import * as React from 'react';
import { Grid, GridItem, ListItem } from '@patternfly/react-core';
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
    <ListItem>
      <Grid hasGutter>
        <GridItem span={10}>
          <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
        </GridItem>
        {percent.length > 0 && (
          <GridItem span={2} className="pf-v6-u-text-align-right" data-test="route-percent">
            {totalPercent || percent}
          </GridItem>
        )}
      </Grid>
      {url.length > 0 && <RoutesUrlLink urls={[url]} title={t('knative-plugin~Location')} />}
      {uniqueRoutes?.length && uniqueRoutes?.length > 0 && (
        <RoutesUrlLink urls={uniqueRoutes} title={t('knative-plugin~Unique Route')} />
      )}
    </ListItem>
  );
};

export default RoutesOverviewListItem;
