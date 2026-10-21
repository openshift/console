import type { FC } from 'react';
import { Content } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import type { ConfigMapKind } from '@console/internal/module/k8s/types';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

type GithubSectionProps = {
  pac: ConfigMapKind;
};

const GithubSection: FC<GithubSectionProps> = ({ pac }) => {
  const { t } = useTranslation();
  const appLink = pac?.data?.['app-link'] ?? '';
  return (
    <Content component="p">
      <Trans t={t} ns="devconsole">
        Use <ExternalLink href={appLink}>{appLink}</ExternalLink> link to install the GitHub
        Application to your repositories in your organisation/account.
      </Trans>
    </Content>
  );
};

export default GithubSection;
