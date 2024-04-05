import * as React from 'react';
import * as semver from 'semver';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@patternfly/react-icons/dist/esm/icons/flag-icon';

import { useOpenShiftVersion } from '@console/shared/src';
import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';
import { DOC_URL_OPENSHIFT_WHATS_NEW } from '../../../../utils';

export const ExploreAdminFeaturesGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';

  const links: GettingStartedLink[] = [
    {
      id: 'openshift-ai',
      title: t('public~OpenShift AI'),
      description: t('public~Build, deploy, and manage AI-enabled applications.'),
      href:
        '/operatorhub/all-namespaces?keyword=openshift+ai&details-item=rhods-operator-redhat-operators-openshift-marketplace',
    },
    {
      id: 'openshift-lightspeed',
      title: t('public~OpenShift LightSpeed'),
      description: t('public~Your personal AI helper.'),
      href:
        '/operatorhub/all-namespaces?keyword=lightspeed&details-item=lightspeed-operator-lightspeed-operator-catalog-openshift-marketplace', // TODO: add correct href
    },
  ];

  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("public~See what's new in OpenShift {{version}}", { version }),
    href: DOC_URL_OPENSHIFT_WHATS_NEW,
    external: true,
  };

  return (
    <GettingStartedCard
      id="admin-features"
      icon={<FlagIcon color="var(--co-global--palette--orange-400)" aria-hidden="true" />}
      title={t('public~Explore new features and capabilities')}
      titleColor={'var(--co-global--palette--orange-400)'}
      links={links}
      moreLink={moreLink}
    />
  );
};
