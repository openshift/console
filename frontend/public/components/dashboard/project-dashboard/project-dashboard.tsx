import { useMemo, memo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import type { K8sResourceKind, Selector } from '../../../module/k8s';
import { LabelSelector, referenceForModel } from '../../../module/k8s';
import { PROJECT_OVERVIEW_USER_PREFERENCE_KEY } from '../dashboards-page/cluster-dashboard/getting-started/constants';
import { ActivityCard } from './activity-card';
import { DetailsCard } from './details-card';
import { GettingStartedSection as DevGettingStartedSection } from './getting-started/GettingStartedSection';
import { InventoryCard } from './inventory-card';
import { LauncherCard } from './launcher-card';
import { ProjectDashboardContext } from './project-dashboard-context';
import { ResourceQuotaCard } from './resource-quota-card';
import { StatusCard } from './status-card';
import { UtilizationCard } from './utilization-card';

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

export const ProjectDashboard = memo<ProjectDashboardProps>(({ obj }) => {
  const { t } = useTranslation('public');
  const [perspective] = useActivePerspective();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const namespaceLinks = useMemo(() => getNamespaceDashboardConsoleLinks(obj, consoleLinks), [
    obj,
    consoleLinks,
  ]);
  const context = useMemo(() => ({ obj, namespaceLinks }), [obj, namespaceLinks]);

  const hasNamespaceLinks = !!namespaceLinks.length;

  const rc = useMemo(
    () => (hasNamespaceLinks ? [{ Card: LauncherCard }, ...rightCards] : rightCards),
    [hasNamespaceLinks],
  );

  return (
    <>
      {perspective === 'dev' && <DocumentTitle>{t('Project overview')}</DocumentTitle>}
      <ProjectDashboardContext.Provider value={context}>
        <Dashboard>
          <DevGettingStartedSection
            userPreferenceKey={
              perspective === 'dev'
                ? 'devconsole.projectOverview.gettingStarted'
                : PROJECT_OVERVIEW_USER_PREFERENCE_KEY
            }
          />
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rc} />
        </Dashboard>
      </ProjectDashboardContext.Provider>
    </>
  );
});

type ProjectDashboardProps = {
  obj: K8sResourceKind;
};
