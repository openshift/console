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

  links.push({
    id: 'functions-tekton-pipelines',
    title: t('knative-plugin~Building Functions on Cluster with Tekton Pipelines'),
    href: 'https://github.com/knative/func/blob/main/docs/building-functions/on_cluster_build.md',
    external: true,
  });

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
