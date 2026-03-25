import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { RepositoryModel } from '../../../models/pipelines';
import type { GitData } from '../import-types';
import { GitReadableTypes } from '../import-types';

interface WebhookToastContentProps {
  repositoryName: string;
  git: GitData;
  projectName: string;
}

const WebhookToastContent: FC<WebhookToastContentProps> = ({
  repositoryName,
  git,
  projectName,
}) => {
  const { t } = useTranslation();
  const translatedGitType = t(GitReadableTypes[git.detectedType]);
  return (
    <>
      <Trans t={t} ns="devconsole" values={{ translatedGitType }}>
        Copy the <b>Webhook URL</b> from the{' '}
        <ExternalLink href={resourcePathFromModel(RepositoryModel, repositoryName, projectName)}>
          Repository Page
        </ExternalLink>{' '}
        and attach it to the{' '}
        <ExternalLink href={git.url}>{'{{translatedGitType}}'} repository</ExternalLink> manually.
      </Trans>
    </>
  );
};

export default WebhookToastContent;
