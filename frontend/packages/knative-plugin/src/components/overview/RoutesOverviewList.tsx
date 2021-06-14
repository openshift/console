import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { RoutesOverviewListItem as routeLinkProps } from '../../types';
import { getKnativeRoutesLinks, groupTrafficByRevision } from '../../utils/resource-overview-utils';
import KSRoutes from './KSRoutes';
import RoutesOverviewListItem from './RoutesOverviewListItem';

export type RoutesOverviewListProps = {
  ksroutes: K8sResourceKind[];
  resource: K8sResourceKind;
};

const RoutesOverviewList: React.FC<RoutesOverviewListProps> = ({ ksroutes, resource }) => {
  const { t } = useTranslation();
  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Routes')} />
      {_.isEmpty(ksroutes) ? (
        <span className="text-muted">{t('knative-plugin~No Routes found for this resource.')}</span>
      ) : (
        <ul className="list-group">
          {_.map(ksroutes, (route) => {
            const routeLinks: routeLinkProps[] = getKnativeRoutesLinks(route, resource);
            if (resource.kind === ServiceModel.kind) {
              return <KSRoutes key={route.metadata.uid} route={route} />;
            }
            if (routeLinks.length > 0) {
              const { urls: uniqueRoutes, percent: totalPercentage } = groupTrafficByRevision(
                route,
                resource,
              );
              return (
                <RoutesOverviewListItem
                  key={route.metadata.uid}
                  uniqueRoutes={uniqueRoutes}
                  totalPercent={totalPercentage}
                  routeLink={routeLinks[0]}
                />
              );
            }
            return null;
          })}
        </ul>
      )}
    </>
  );
};

export default RoutesOverviewList;
