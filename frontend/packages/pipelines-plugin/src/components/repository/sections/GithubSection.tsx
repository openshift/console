import * as React from 'react';
import { Content } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { ConfigMapKind } from '@console/internal/module/k8s/types';

type GithubSectionProps = {
  pac: ConfigMapKind;
};

const GithubSection: React.FC<GithubSectionProps> = ({ pac }) => {
  const { t } = useTranslation();
  const appLink = pac?.data?.['app-link'] ?? '';
  return (
    <Content component="p">
      <Trans t={t} ns="pipelines-plugin">
        Use{' '}
        <a target="_blank" href={appLink} rel="noopener noreferrer">
          {appLink}
        </a>{' '}
        link to install the GitHub Application to your repositories in your organisation/account.
      </Trans>
    </Content>
  );
};

export default GithubSection;
