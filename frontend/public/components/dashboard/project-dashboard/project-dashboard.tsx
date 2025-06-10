import * as React from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, LabelSelector, referenceForModel, Selector } from '../../../module/k8s';
import { DetailsCard } from './details-card';
import { StatusCard } from './status-card';
import { UtilizationCard } from './utilization-card';
import { InventoryCard } from './inventory-card';
import { ActivityCard } from './activity-card';
import { ProjectDashboardContext } from './project-dashboard-context';
import { LauncherCard } from './launcher-card';
import { ResourceQuotaCard } from './resource-quota-card';
import { GettingStartedSection as DevGettingStartedSection } from './getting-started/GettingStartedSection';
import { PROJECT_OVERVIEW_USER_SETTINGS_KEY } from '../dashboards-page/cluster-dashboard/getting-started/constants';

const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }, { Card: ResourceQuotaCard }];
const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const rightCards = [{ Card: ActivityCard }];

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

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ obj }) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
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
    <>
      {perspective === 'dev' && <DocumentTitle>{t('public~Project overview')}</DocumentTitle>}
      <ProjectDashboardContext.Provider value={context}>
        <Dashboard>
          <DevGettingStartedSection
            userSettingKey={
              perspective === 'dev'
                ? 'devconsole.projectOverview.gettingStarted'
                : PROJECT_OVERVIEW_USER_SETTINGS_KEY
            }
          />
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rc} />
        </Dashboard>
      </ProjectDashboardContext.Provider>
    </>
  );
};

type ProjectDashboardProps = {
  obj: K8sResourceKind;
};
