import * as React from 'react';
import { GithubIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ResourceLink, ExternalLink, CopyToClipboard } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RepositoryModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { baseURL, RepositoryLabels, RepositoryFields } from './consts';

export type RepositoryLinkListProps = {
  pipelineRun: PipelineRunKind;
};

const RepositoryLinkList: React.FC<RepositoryLinkListProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const plrLabels = pipelineRun.metadata.labels;
  const repoLabel = RepositoryLabels[RepositoryFields.REPOSITORY];
  const repoName = plrLabels?.[repoLabel];
  const urlOrg = plrLabels[RepositoryLabels[RepositoryFields.URL_ORG]];
  const urlRepo = plrLabels[RepositoryLabels[RepositoryFields.URL_REPO]];
  const repoURL = urlOrg && urlRepo && `${baseURL}/${urlOrg}/${urlRepo}`;

  if (!repoName) return null;

  return (
    <dl>
      <dt>{t('pipelines-plugin~Repository')}</dt>
      <dd>
        <ResourceLink
          data-test="pl-repository-link"
          kind={referenceForModel(RepositoryModel)}
          name={repoName}
          namespace={pipelineRun.metadata.namespace}
        />
        {repoURL && (
          <ExternalLink href={repoURL}>
            <GithubIcon title={repoURL} /> {repoURL}
          </ExternalLink>
        )}
      </dd>
      {plrLabels[RepositoryLabels[RepositoryFields.BRANCH]] && (
        <>
          <dt>{t('pipelines-plugin~Branch')}</dt>
          <dd data-test="pl-repository-branch">
            {plrLabels[RepositoryLabels[RepositoryFields.BRANCH]]}
          </dd>
        </>
      )}
      {plrLabels[RepositoryLabels[RepositoryFields.SHA]] && (
        <>
          <dt>{t('pipelines-plugin~Commit id')}</dt>
          <dd>
            <CopyToClipboard
              value={plrLabels[RepositoryLabels[RepositoryFields.SHA]]}
              data-test="pl-commit-id"
            />
          </dd>
        </>
      )}
      {plrLabels[RepositoryLabels[RepositoryFields.EVENT_TYPE]] && (
        <>
          <dt>{t('pipelines-plugin~Event type')}</dt>
          <dd data-test="pl-event-type">
            {plrLabels[RepositoryLabels[RepositoryFields.EVENT_TYPE]]}
          </dd>
        </>
      )}
    </dl>
  );
};

export default RepositoryLinkList;
