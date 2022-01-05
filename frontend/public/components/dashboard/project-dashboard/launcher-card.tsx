import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import LauncherBody from '@console/shared/src/components/dashboard/launcher-card/LauncherBody';
import LauncherItem from '@console/shared/src/components/dashboard/launcher-card/LauncherItem';
import { ProjectDashboardContext } from './project-dashboard-context';

export const LauncherCard: React.FC = () => {
  const { namespaceLinks } = React.useContext(ProjectDashboardContext);
  const { t } = useTranslation();
  return (
    <Card data-test-id="launcher-card">
      <CardHeader>
        <CardTitle>{t('public~Launcher')}</CardTitle>
      </CardHeader>
      <CardBody>
        <LauncherBody>
          {_.sortBy(namespaceLinks, 'spec.text').map((nl) => (
            <LauncherItem key={nl.metadata.uid} consoleLink={nl} />
          ))}
        </LauncherBody>
      </CardBody>
    </Card>
  );
};
