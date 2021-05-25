import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheckIcon } from '@patternfly/react-icons';

import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';

import { useIdentityProviderLink } from './cluster-setup-identity-provider-link';
import { useAlertReceiverLink } from './cluster-setup-alert-receiver-link';

export const ClusterSetupGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();

  const identityProviderLink = useIdentityProviderLink();
  const alertReceiverLink = useAlertReceiverLink();

  const links = [identityProviderLink, alertReceiverLink].filter(Boolean);

  if (links.length === 0) {
    return null;
  }

  const moreLinkBaseURL = window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';
  const moreLinkURL = `${moreLinkBaseURL}post_installation_configuration/machine-configuration-tasks.html`;
  const moreLink: GettingStartedLink = {
    key: 'quick-starts',
    title: t('public~View all steps in documentation'),
    href: moreLinkURL,
    external: true,
  };

  return (
    <GettingStartedCard
      icon={<ClipboardCheckIcon color="var(--pf-global--primary-color--100)" aria-hidden="true" />}
      title={t('public~Set up your cluster')}
      titleColor={'var(--pf-global--palette--blue-600)'}
      description={t('public~Finish setting up your cluster with recommended configurations.')}
      links={links}
      moreLink={moreLink}
    />
  );
};
