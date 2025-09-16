import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CopyToClipboard,
  truncateMiddle,
  ResourceIcon,
  resourcePath,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { RepositoryModel } from '../../models';
import { PipelineRunKind } from '../../types';
import {
  RepositoryAnnotations,
  RepoAnnotationFields,
  RepositoryFields,
  RepositoryLabels,
} from './consts';
import { getGitProviderIcon, getLabelValue, sanitizeBranchName } from './repository-utils';

export type RepositoryLinkListProps = {
  pipelineRun: PipelineRunKind;
};

const RepositoryLinkList: React.FC<RepositoryLinkListProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const plrLabels = pipelineRun.metadata.labels;
  const plrAnnotations = pipelineRun.metadata.annotations;
  const repoLabel = RepositoryLabels[RepositoryFields.REPOSITORY];
  const repoName = plrLabels?.[repoLabel];
  const repoURL = plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.REPO_URL]];
  const shaURL = plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_URL]];
  const branchName =
    plrLabels?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]] ||
    plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]];

  if (!repoName) return null;

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('pipelines-plugin~Repository')}</DescriptionListTerm>
        <DescriptionListDescription>
          <div>
            <ResourceIcon kind={referenceForModel(RepositoryModel)} />
            <Link
              data-test="pl-repository-link"
              to={`${resourcePath(
                referenceForModel(RepositoryModel),
                repoName,
                pipelineRun.metadata.namespace,
              )}/Runs`}
              className="co-resource-item__resource-name"
            >
              {repoName}
            </Link>
          </div>
          {repoURL && (
            <ExternalLink href={repoURL}>
              {getGitProviderIcon(repoURL)} {repoURL}
            </ExternalLink>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      {branchName && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t(getLabelValue(branchName))}</DescriptionListTerm>
          <DescriptionListDescription data-test="pl-repository-branch">
            {sanitizeBranchName(branchName)}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {plrLabels?.[RepositoryLabels[RepositoryFields.SHA]] && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Commit id')}</DescriptionListTerm>
          <DescriptionListDescription>
            {shaURL ? (
              <ExternalLink href={shaURL} data-test="pl-sha-url">
                {truncateMiddle(plrLabels[RepositoryLabels[RepositoryFields.SHA]], {
                  length: 7,
                  truncateEnd: true,
                  omission: '',
                })}
              </ExternalLink>
            ) : (
              <CopyToClipboard
                value={plrLabels[RepositoryLabels[RepositoryFields.SHA]]}
                data-test="pl-commit-id"
              />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {plrLabels?.[RepositoryLabels[RepositoryFields.EVENT_TYPE]] && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Event type')}</DescriptionListTerm>
          <DescriptionListDescription data-test="pl-event-type">
            {plrLabels[RepositoryLabels[RepositoryFields.EVENT_TYPE]]}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
};

export default RepositoryLinkList;
