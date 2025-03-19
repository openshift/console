import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';

const HelpTourText: React.FC = () => {
  const { t } = useTranslation();
  return t(
    'console-app~Access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console. You can also restart this tour anytime here.',
  );
};

export const helpTourText = <HelpTourText />;

const UserPrefrencesTourText: React.FC = () => {
  const { t } = useTranslation();
  return t(
    'console-app~Set your individual console preferences including default views, language, import settings, and more.',
  );
};

export const userPreferencesTourText = <UserPrefrencesTourText />;

export const FinishTourText: React.FC = () => {
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const { t } = useTranslation();
  const openshiftBlogLink =
    consoleLinks.filter((link: K8sResourceKind) => link.metadata.name === 'openshift-blog')[0]?.spec
      ?.href || 'https://developers.redhat.com/products/openshift/whats-new';
  // declaring openshiftHelpBase instead of importing because it throws error while using it as tour extension
  const openshiftHelpBase =
    window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';
  return (
    <Trans t={t} ns="console-app">
      Stay up-to-date with everything OpenShift on our{' '}
      <a
        href={openshiftBlogLink}
        target="_blank"
        rel="noopener noreferrer"
        data-test="openshift-blog-link"
      >
        blog
      </a>{' '}
      or continue to learn more in our{' '}
      <a
        href={openshiftHelpBase}
        target="_blank"
        rel="noopener noreferrer"
        data-test="openshift-docs-link"
      >
        documentation
      </a>
      .
    </Trans>
  );
};

export const finishTourText = <FinishTourText />;
