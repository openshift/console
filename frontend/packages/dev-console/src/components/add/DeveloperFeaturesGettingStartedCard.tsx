import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@patternfly/react-icons';

import { ALL_NAMESPACES_KEY, useActiveNamespace, useOpenshiftVersion } from '@console/shared/src';
import {
  GettingStartedLink,
  GettingStartedCard,
} from '@console/shared/src/components/getting-started';

export const DeveloperFeaturesGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  // Show only major and minor version.
  const version = (useOpenshiftVersion() || '')
    .split('.')
    .slice(0, 2)
    .join('.');

  const links: GettingStartedLink[] = [
    {
      id: 'helm-charts',
      title: t('devconsole~Discover certified Helm Charts'),
      href:
        activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
          ? `/catalog/ns/${activeNamespace}?catalogType=HelmChart`
          : '/catalog/all-namespaces?catalogType=HelmChart',
    },
    {
      id: 'topology',
      title: t('devconsole~Start building your application quickly in topology'),
      href:
        activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
          ? `/topology/ns/${activeNamespace}?catalogSearch=`
          : '/topology/all-namespaces?catalogSearch=',
    },
  ];

  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("devconsole~What's new in OpenShift {{version}}", { version }),
    href: 'https://developers.redhat.com/products/openshift/getting-started',
    external: true,
  };

  return (
    <GettingStartedCard
      id="developer-features"
      icon={<FlagIcon color="var(--pf-global--palette--orange-300)" aria-hidden="true" />}
      title={t('devconsole~Explore new developer features')}
      titleColor={'var(--pf-global--palette--gold-700)'}
      description={t(
        'devconsole~Explore new features and resources within the developer perspective.',
      )}
      links={links}
      moreLink={moreLink}
    />
  );
};
