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

  const moreLinkURL = window.SERVER_FLAGS.documentationBaseURL
    ? `${window.SERVER_FLAGS.documentationBaseURL}html/post-installation_configuration/index`
    : 'https://docs.okd.io/latest/post_installation_configuration/configuring-private-cluster.html';

  const moreLink: GettingStartedLink = {
    id: 'machine-configuration',
    title: t('public~View all steps in documentation'),
    href: moreLinkURL,
    external: true,
  };

  return (
    <GettingStartedCard
      id="cluster-setup"
      icon={<ClipboardCheckIcon color="var(--pf-global--primary-color--100)" aria-hidden="true" />}
      title={t('public~Set up your cluster')}
      titleColor={'var(--pf-global--palette--blue-600)'}
      description={t('public~Finish setting up your cluster with recommended configurations.')}
      links={links}
      moreLink={moreLink}
    />
  );
};
