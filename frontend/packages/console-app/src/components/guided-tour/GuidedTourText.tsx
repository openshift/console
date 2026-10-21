import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

const HelpTourText: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      {t(
        'console-app~Access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console. You can also restart this tour anytime here.',
      )}
    </>
  );
};

export const helpTourText = <HelpTourText />;

const UserPrefrencesTourText: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      {t(
        'console-app~Set your individual console preferences including default views, language, import settings, and more.',
      )}
    </>
  );
};

export const userPreferencesTourText = <UserPrefrencesTourText />;

export const FinishTourText: FC = () => {
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const { t } = useTranslation();
  const openshiftBlogLink =
    consoleLinks.filter((link: K8sResourceKind) => link.metadata?.name === 'openshift-blog')[0]
      ?.spec?.href || 'https://developers.redhat.com/products/openshift/whats-new';
  // declaring openshiftHelpBase instead of importing because it throws error while using it as tour extension
  const openshiftHelpBase =
    window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';
  return (
    <Trans t={t} ns="console-app">
      Stay up-to-date with everything OpenShift on our{' '}
      <ExternalLink href={openshiftBlogLink} data-test="openshift-blog-link">
        blog
      </ExternalLink>{' '}
      or continue to learn more in our{' '}
      <ExternalLink href={openshiftHelpBase} data-test="openshift-help-link">
        documentation
      </ExternalLink>
      .
    </Trans>
  );
};

export const finishTourText = <FinishTourText />;
