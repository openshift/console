import type { FC } from 'react';
import { useMemo } from 'react';
import * as semver from 'semver';
import { useTranslation } from 'react-i18next';
import { RhUiFlagIcon } from '@patternfly/react-icons';
import { FLAGS } from '@console/shared/src/constants/common';
import { useOpenShiftVersion } from '@console/shared/src/hooks/useClusterVersion';
import { useFlag } from '@console/shared/src/hooks/useFlag';

import type { GettingStartedLink } from '@console/shared/src/components/getting-started/GettingStartedCard';
import { GettingStartedCard } from '@console/shared/src/components/getting-started/GettingStartedCard';
import { lightspeedOperatorURL } from '@console/app/src/components/lightspeed/Lightspeed';
import { DOC_URL_OPENSHIFT_WHATS_NEW } from '../../../../utils/documentation';

export const ExploreAdminFeaturesGettingStartedCard: FC = () => {
  const { t } = useTranslation('public');
  const canListPackageManifest = useFlag(FLAGS.CAN_LIST_PACKAGE_MANIFEST);
  const canListOperatorGroup = useFlag(FLAGS.CAN_LIST_OPERATOR_GROUP);
  const lightspeedIsAvailable = useFlag(FLAGS.LIGHTSPEED_IS_AVAILABLE_TO_INSTALL);
  const showLightSpeedLink =
    canListPackageManifest && canListOperatorGroup && lightspeedIsAvailable;
  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';
  const links: GettingStartedLink[] = useMemo(
    () => [
      {
        id: 'openshift-ai',
        title: t('OpenShift AI'),
        description: t('Build, deploy, and manage AI-enabled applications.'),
        href:
          '/catalog?catalogType=operator&keyword=openshift+ai&selectedId=rhods-operator-redhat-operators-openshift-marketplace',
      },
      {
        id: 'trusted-software-supply-chain',
        title: t('Trusted Software Supply Chain'),
        description: t('Assess risk, validate integrity, secure artifacts, release safely.'),
        href: '/quickstart?keyword=trusted',
      },
      ...(showLightSpeedLink
        ? [
            {
              id: 'lightspeed',
              title: t('OpenShift Lightspeed'),
              description: t('Your personal AI helper.'),
              href: lightspeedOperatorURL,
            },
          ]
        : [
            {
              id: 'new-translations',
              title: t('French and Spanish now available'),
              description: t('Console language options now include French and Spanish.'),
              href: '/user-preferences/language',
            },
          ]),
    ],
    [showLightSpeedLink, t],
  );

  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("See what's new in OpenShift {{version}}", { version }),
    href: DOC_URL_OPENSHIFT_WHATS_NEW,
    external: true,
  };

  return (
    <GettingStartedCard
      id="admin-features"
      icon={<RhUiFlagIcon color="var(--co-global--palette--orange-400)" aria-hidden="true" />}
      title={t('Explore new features and capabilities')}
      titleColor={'var(--co-global--palette--orange-400)'}
      links={links}
      moreLink={moreLink}
    />
  );
};
