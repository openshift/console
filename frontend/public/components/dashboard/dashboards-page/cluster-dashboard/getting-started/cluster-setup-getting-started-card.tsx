import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheckIcon } from '@patternfly/react-icons/dist/esm/icons/clipboard-check-icon';

import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';

import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';

import { useIdentityProviderLink } from './cluster-setup-identity-provider-link';
import { useAlertReceiverLink } from './cluster-setup-alert-receiver-link';
import { documentationURLs, getDocumentationURL, isManaged } from '../../../../utils';
import { TourActions, TourContext } from '@console/app/src/components/tour';

export const ClusterSetupGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const canUpgrade = useCanClusterUpgrade();

  const { tourDispatch, tour } = React.useContext(TourContext);

  const identityProviderLink = useIdentityProviderLink();
  const alertReceiverLink = useAlertReceiverLink();
  const takeConsoleTourAction: GettingStartedLink = {
    id: 'console-tour',
    title: t('public~Take console tour'),
    onClick: () => {
      fireTelemetryEvent('launch-guided-tour-form-getting-started-card');
      tourDispatch({ type: TourActions.start });
    },
  };

  const links = [
    tour && takeConsoleTourAction,
    canUpgrade && identityProviderLink,
    alertReceiverLink,
  ].filter(Boolean);

  if (links.length === 0) {
    return null;
  }

  const moreLinkURL = getDocumentationURL(
    documentationURLs.postInstallationMachineConfigurationTasks,
  );

  const moreLink: GettingStartedLink = {
    id: 'machine-configuration',
    title: t('public~View all steps in documentation'),
    href: moreLinkURL,
    external: true,
  };

  return (
    <GettingStartedCard
      id="cluster-setup"
      icon={<ClipboardCheckIcon color="var(--co-global--palette--blue-400)" aria-hidden="true" />}
      title={t('public~Set up your cluster')}
      titleColor={'var(--co-global--palette--blue-400)'}
      description={t('public~Finish setting up your cluster with recommended configurations.')}
      links={links}
      moreLink={!isManaged() && moreLink}
    />
  );
};
