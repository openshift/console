import * as React from 'react';
import * as _ from 'lodash-es';

import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { K8sResourceKind, LabelSelector, Selector } from '../../../module/k8s';
import { DetailsCard } from './details-card';
import { StatusCard } from './status-card';
import { UtilizationCard } from './utilization-card';
import { InventoryCard } from './inventory-card';
import { ActivityCard } from './activity-card';
import { ProjectDashboardContext } from './project-dashboard-context';
import { LauncherCard } from './launcher-card';
import { connect } from 'react-redux';
import { RootState } from '../../../redux';
import { ResourceQuotaCard } from './resource-quota-card';

const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }, { Card: ResourceQuotaCard }];
const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const rightCards = [{ Card: ActivityCard }];

const mapStateToProps = ({ UI }: RootState): ProjectDashboardReduxProps => ({
  consoleLinks: UI.get('consoleLinks'),
});

export const getNamespaceDashboardConsoleLinks = (
  ns: K8sResourceKind,
  consoleLinks: K8sResourceKind[],
): K8sResourceKind[] => {
  return _.filter(consoleLinks, (link: K8sResourceKind): boolean => {
    if (link.spec.location !== 'NamespaceDashboard') {
      return false;
    }

    const namespaces: string[] = _.get(link, 'spec.namespaceDashboard.namespaces');
    const selector: Selector = _.get(link, 'spec.namespaceDashboard.namespaceSelector');

    // If neither namespaces or selector was provided, show the link for all namespaces.
    if (_.isEmpty(namespaces) && _.isEmpty(selector)) {
      return true;
    }

    // Show the link if either namespaces or the selector matches this namespace.
    if (_.includes(namespaces, ns.metadata.name)) {
      return true;
    }

    return !_.isEmpty(selector) && new LabelSelector(selector).matches(ns);
  });
};

const ProjectDashboard_: React.FC<ProjectDashboardReduxProps & ProjectDashboardProps> = ({
  obj,
  consoleLinks,
}) => {
  const namespaceLinks = getNamespaceDashboardConsoleLinks(obj, consoleLinks);
  const context = {
    obj,
    namespaceLinks,
  };

  const hasNamespaceLinks = !!namespaceLinks.length;

  const rc = React.useMemo(
    () => (hasNamespaceLinks ? [{ Card: LauncherCard }, ...rightCards] : rightCards),
    [hasNamespaceLinks],
  );

  return (
    <ProjectDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rc} />
      </Dashboard>
    </ProjectDashboardContext.Provider>
  );
};

export const ProjectDashboard = connect<ProjectDashboardReduxProps, {}, ProjectDashboardProps>(
  mapStateToProps,
)(ProjectDashboard_);

type ProjectDashboardReduxProps = {
  consoleLinks: K8sResourceKind[];
};

type ProjectDashboardProps = {
  obj: K8sResourceKind;
};
