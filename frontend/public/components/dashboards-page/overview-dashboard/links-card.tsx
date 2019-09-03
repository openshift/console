import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { LinksBody } from '../../dashboard/links-card/links-body';
import { LinkItem } from '../../dashboard/links-card/link-item';

const LinksCard_: React.FC<LinksCardProps> = ({consoleLinks}) => {
  const clusterDashboardLinks = _.sortBy(_.filter(consoleLinks, link => link.spec.location === 'ClusterDashboard'), 'spec.text');

  return (
    !_.isEmpty(clusterDashboardLinks) && <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Links</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <LinksBody>
          {_.map(clusterDashboardLinks, link => <LinkItem link={link} key={link.metadata.uid} />)}
        </LinksBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

const LinksCardStateToProps = ({UI}) => ({
  consoleLinks: UI.get('consoleLinks'),
});

export const LinksCard = connect(LinksCardStateToProps)(LinksCard_);

export type LinksCardProps = {
  consoleLinks: K8sResourceKind[];
};
