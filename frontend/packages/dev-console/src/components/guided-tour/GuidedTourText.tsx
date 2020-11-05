import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useOpenshiftVersion } from '@console/shared/src/hooks/version';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConsoleLinkModel } from '@console/internal/models';

const DevPerspectiveTourText: React.FC = () => {
  const openshiftVersion = useOpenshiftVersion();
  const { t } = useTranslation();
  return (
    <>
      {t('devconsole~Get started with a tour of some of the key areas in OpenShift')}{' '}
      {openshiftVersion ? `${openshiftVersion?.slice(0, 3)}'s` : '4.x'}{' '}
      {t(
        'devconsole~Developer perspective that can help you complete workflows and be more productive.',
      )}
    </>
  );
};

export const devPerspectiveTourText = <DevPerspectiveTourText />;

const PerspectiveSwitcherTourText: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('devconsole~Switch between the Developer and Administrator perspectives.')}</p>
      <p>
        {t(
          'devconsole~Use the Administrator perspective to manage workload storage, networking, cluster settings, and more. This may require additional user access.',
        )}
      </p>
      <p>
        {t(
          'devconsole~Use the Developer perspective to build applications and associated components and services, define how they work together, and monitor their health over time.',
        )}
      </p>
    </>
  );
};

export const perspectiveSwitcherTourText = <PerspectiveSwitcherTourText />;

export const SearchTourText: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <p>
        {t(
          'devconsole~Search for resources in your project by simply starting to type or scrolling through a list of existing resources.',
        )}
      </p>
      <p>
        {t(
          'devconsole~Add frequently accessed resources to your side navigation for quick access. Look for the',
        )}{' '}
        <span style={{ color: 'var(--pf-global--palette--blue-400)' }}>
          <PlusCircleIcon /> {t('devconsole~Add to navigation')}
        </span>{' '}
        {t('devconsole~link next to your search result.')}
      </p>
    </>
  );
};

export const searchTourText = <SearchTourText />;

const FinishTourText: React.FC = () => {
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const { t } = useTranslation();
  const openshiftBlogLink = consoleLinks.filter(
    (link: K8sResourceKind) => link.metadata.name === 'openshift-blog',
  )[0]?.spec?.href;
  // declaring openshiftHelpBase instead of importing because it throws error while using it as tour extension
  const openshiftHelpBase =
    window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';
  return (
    <>
      {t('devconsole~Stay up-to-date with everything OpenShift on our')}{' '}
      <a href={openshiftBlogLink} target="_blank" rel="noopener noreferrer">
        {t('devconsole~blog')}
      </a>{' '}
      {t('devconsole~or continue to learn more in our')}{' '}
      <a href={openshiftHelpBase} target="_blank" rel="noopener noreferrer">
        {t('devconsole~documentation')}
      </a>
      .
    </>
  );
};

export const finishTourText = <FinishTourText />;
