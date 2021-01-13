import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import LauncherBody from '@console/shared/src/components/dashboard/launcher-card/LauncherBody';
import LauncherItem from '@console/shared/src/components/dashboard/launcher-card/LauncherItem';
import { ProjectDashboardContext } from './project-dashboard-context';

export const LauncherCard: React.FC = () => {
  const { namespaceLinks } = React.useContext(ProjectDashboardContext);
  const { t } = useTranslation();
  return (
    <DashboardCard data-test-id="launcher-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('public~Launcher')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <LauncherBody>
          {_.sortBy(namespaceLinks, 'spec.text').map((nl) => (
            <LauncherItem key={nl.metadata.uid} consoleLink={nl} />
          ))}
        </LauncherBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
