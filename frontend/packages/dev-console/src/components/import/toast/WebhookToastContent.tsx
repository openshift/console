import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { RepositoryModel } from '@console/pipelines-plugin/src/models';
import { GitData, GitReadableTypes } from '../import-types';

interface WebhookToastContentProps {
  repositoryName: string;
  git: GitData;
  projectName: string;
}

const WebhookToastContent: React.FC<WebhookToastContentProps> = ({
  repositoryName,
  git,
  projectName,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Trans t={t} ns="devconsole">
        Copy the <b>Webhook URL</b> from the{' '}
        <a
          href={resourcePathFromModel(RepositoryModel, repositoryName, projectName)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Repository Page
        </a>{' '}
        and attach it to the{' '}
        <a href={git.url} target="_blank" rel="noopener noreferrer">
          {GitReadableTypes[git.detectedType]} repository
        </a>{' '}
        manually.
      </Trans>
    </>
  );
};

export default WebhookToastContent;
