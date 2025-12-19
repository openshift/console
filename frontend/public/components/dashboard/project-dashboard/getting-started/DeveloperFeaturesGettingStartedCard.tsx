import type { FC } from 'react';
import { FlagIcon } from '@patternfly/react-icons/dist/esm/icons/flag-icon';
import { useTranslation } from 'react-i18next';
import * as semver from 'semver';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useOpenShiftVersion } from '@console/shared/src/hooks/version';
import {
  GettingStartedLink,
  GettingStartedCard,
} from '@console/shared/src/components/getting-started';
import { getDisabledAddActions } from '@console/dev-console/src/utils/useAddActionExtensions';

export const DeveloperFeaturesGettingStartedCard: FC = () => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const isHelmEnabled = useFlag('OPENSHIFT_HELM');
  const isHelmVisible = useFlag('HELM_CHARTS_CATALOG_TYPE');
  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';

  const links: GettingStartedLink[] = [];

  const disabledAddActions = getDisabledAddActions();
  if (isHelmEnabled && isHelmVisible && !disabledAddActions?.includes('helm')) {
    links.push({
      id: 'helm-charts',
      title: t('public~Try the sample AI Chatbot Helm chart'),
      href:
        activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
          ? `/catalog/ns/${activeNamespace}?catalogType=HelmChart&keyword=chatbot+AI+sample`
          : '/catalog/all-namespaces?catalogType=HelmChart&keyword=chatbot+AI+sample',
    });
  }

  links.push({
    id: 'topology',
    title: t('public~Start building your application quickly in topology'),
    href:
      activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
        ? `/topology/ns/${activeNamespace}?catalogSearch=`
        : '/topology/all-namespaces?catalogSearch=',
  });

  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("public~What's new in OpenShift {{version}}", { version }),
    href: 'https://developers.redhat.com/products/openshift/whats-new',
    external: true,
  };

  return (
    <GettingStartedCard
      id="developer-features"
      icon={<FlagIcon color="var(--co-global--palette--orange-400)" aria-hidden="true" />}
      title={t('public~Explore new developer features')}
      titleColor={'var(--co-global--palette--orange-400)'}
      description={t('public~Explore new features and resources within the developer perspective.')}
      links={links}
      moreLink={moreLink}
    />
  );
};
