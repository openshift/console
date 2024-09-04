import * as React from 'react';
import * as semver from 'semver';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@patternfly/react-icons/dist/esm/icons/flag-icon';
import { FLAGS, useOpenShiftVersion } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';

import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';
import { lightspeedOperatorURL } from '@console/app/src/components/lightspeed/Lightspeed';
import { DOC_URL_OPENSHIFT_WHATS_NEW } from '../../../../utils';

export const ExploreAdminFeaturesGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const canListPackageManifest = useFlag(FLAGS.CAN_LIST_PACKAGE_MANIFEST);
  const canListOperatorGroup = useFlag(FLAGS.CAN_LIST_OPERATOR_GROUP);
  const lightspeedIsAvailable = useFlag(FLAGS.LIGHTSPEED_IS_AVAILABLE_TO_INSTALL);
  const showLightSpeedLink =
    canListPackageManifest && canListOperatorGroup && lightspeedIsAvailable;
  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';
  const links: GettingStartedLink[] = React.useMemo(
    () => [
      {
        id: 'openshift-ai',
        title: t('public~OpenShift AI'),
        description: t('public~Build, deploy, and manage AI-enabled applications.'),
        href:
          '/operatorhub/all-namespaces?keyword=openshift+ai&details-item=rhods-operator-redhat-operators-openshift-marketplace',
      },
      ...(showLightSpeedLink
        ? [
            {
              id: 'lightspeed',
              title: t('public~OpenShift Lightspeed'),
              description: t('public~Your personal AI helper.'),
              href: lightspeedOperatorURL,
            },
          ]
        : [
            {
              id: 'new-translations',
              title: t('public~French and Spanish now available'),
              description: t('public~Console language options now include French and Spanish.'),
              href: '/user-preferences/language',
            },
          ]),
    ],
    [showLightSpeedLink, t],
  );

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
