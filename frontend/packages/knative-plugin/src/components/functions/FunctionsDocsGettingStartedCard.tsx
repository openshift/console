import * as React from 'react';
import { FlagIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import {
  GettingStartedLink,
  GettingStartedCard,
} from '@console/shared/src/components/getting-started';

export const FunctionsDocsGettingStartedCard: React.FC = () => {
  const { t } = useTranslation();
  const links: GettingStartedLink[] = [];

  links.push(
    {
      id: 'learn-more-about-functions-link',
      title: t('knative-plugin~Learn more about Serverless Functions'),
      href: 'https://www.youtube.com/watch?v=lNeieapAhnc',
      external: true,
    },
    {
      id: 'learn-more-about-containers-link',
      title: t('knative-plugin~Learn more about Serverless Containers'),
      href: 'https://www.youtube.com/watch?v=oKIHoDzw1RI',
      external: true,
    },
    {
      id: 'event-driven-apps-link',
      title: t('knative-plugin~Explore how to create Event Driven Apps using OpenShift Serverless'),
      href: 'https://access.redhat.com/documentation/en-us/red_hat_openshift_serverless/',
      external: true,
    },
  );

  return (
    <GettingStartedCard
      id="serverless-features"
      icon={<FlagIcon color="var(--co-global--palette--orange-400)" aria-hidden="true" />}
      title={t('knative-plugin~Explore serverless functions')}
      titleColor={'var(--co-global--palette--orange-400)'}
      description={t(
        'knative-plugin~Explore new features and resources within the serverless functions.',
      )}
      links={links}
    />
  );
};
