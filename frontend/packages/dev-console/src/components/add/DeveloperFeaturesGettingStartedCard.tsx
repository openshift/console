import * as React from 'react';
import { FlagIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import * as semver from 'semver';
import { ALL_NAMESPACES_KEY, useActiveNamespace, useOpenShiftVersion } from '@console/shared/src';
import {
  GettingStartedLink,
  GettingStartedCard,
} from '@console/shared/src/components/getting-started';
import { fromHelmCharts } from '../../actions/add-resources';
import { getDisabledAddActions } from '../../utils/useAddActionExtensions';

export const DeveloperFeaturesGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const parsed = semver.parse(useOpenShiftVersion());
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '';

  const links: GettingStartedLink[] = [];

  const disabledAddActions = getDisabledAddActions();
  if (!disabledAddActions?.includes(fromHelmCharts.id)) {
    links.push({
      id: 'helm-charts',
      title: t('devconsole~Discover certified Helm Charts'),
      href:
        activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
          ? `/catalog/ns/${activeNamespace}?catalogType=HelmChart`
          : '/catalog/all-namespaces?catalogType=HelmChart',
    });
  }

  links.push({
    id: 'topology',
    title: t('devconsole~Start building your application quickly in topology'),
    href:
      activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
        ? `/topology/ns/${activeNamespace}?catalogSearch=`
        : '/topology/all-namespaces?catalogSearch=',
  });

  const moreLink: GettingStartedLink = {
    id: 'whats-new',
    title: t("devconsole~What's new in OpenShift {{version}}", { version }),
    href: 'https://developers.redhat.com/products/openshift/whats-new',
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
