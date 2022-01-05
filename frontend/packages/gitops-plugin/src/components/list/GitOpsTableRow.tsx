import * as React from 'react';
import { Flex, FlexItem, Split, SplitItem } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { ExternalLink, Timestamp } from '@console/internal/components/utils';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import GitOpsSyncFragment from './GitOpsSyncFragment';

import './GitOpsTableRow.scss';

const tableColumnClasses = [
  classNames('pf-m-width-20'), // Application name
  classNames('pf-m-width-30'), // Git repository
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'pf-m-width-20'), // Environments
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-m-width-30'), // Last deployment
];

const getMatchingEnvs = (envs: string[], desiredStatus: string) => (
  acc: string[],
  status: string,
  idx: number,
): string[] =>
  desiredStatus === status
    ? [...acc, envs[idx]] // 1:1 between a status and an env
    : acc;

const GitOpsTableRow: React.FC<RowFunctionArgs<GitOpsAppGroupData>> = (props) => {
  const { obj: appGroup } = props;
  const {
    name,
    sync_status: syncStatuses = [],
    environments: envs,
    last_deployed: lastDeployed = [],
    repo_url: repoUrl,
  } = appGroup;
  const { t } = useTranslation();
  const syncedEnvs: string[] = syncStatuses.reduce(getMatchingEnvs(envs, 'Synced'), []);
  const outOfSyncEnvs: string[] = syncStatuses.reduce(getMatchingEnvs(envs, 'OutOfSync'), []);
  const unknownEnvs: string[] = syncStatuses.reduce(getMatchingEnvs(envs, 'Unknown'), []);
  const latestDeployedTime = lastDeployed.reduce(
    (leadingDeployedTime, deployedTime) =>
      leadingDeployedTime < deployedTime ? deployedTime : leadingDeployedTime,
    '',
  );
  const latestDeployedEnv = latestDeployedTime
    ? envs[lastDeployed.indexOf(latestDeployedTime)]
    : '';
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <Link to={`/environments/${appGroup.name}?url=${appGroup.repo_url}`} title={name}>
          {name}
        </Link>
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ExternalLink href={repoUrl} additionalClassName={'co-break-all'}>
          <span style={{ marginRight: 'var(--pf-global--spacer--xs)' }}>
            {routeDecoratorIcon(repoUrl, 12, t)}
          </span>
          <span style={{ marginRight: 'var(--pf-global--spacer--xs)' }}>{repoUrl}</span>
        </ExternalLink>
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'pf-u-text-nowrap')}>
        {syncStatuses.length > 0 ? (
          <Flex className="gop-gitops-syncStatus">
            <GitOpsSyncFragment
              tooltip={syncedEnvs.map((env) => (
                <Split className="gop-gitops-tooltip-text" hasGutter key={`${name}-${env}`}>
                  <SplitItem>
                    <GreenCheckCircleIcon />
                  </SplitItem>
                  <SplitItem isFilled>{env}</SplitItem>
                  <SplitItem>{t('gitops-plugin~Synced')}</SplitItem>
                </Split>
              ))}
              count={syncedEnvs.length}
              icon="check"
            />
            <GitOpsSyncFragment
              tooltip={outOfSyncEnvs.map((env) => (
                <Split className="gop-gitops-tooltip-text" hasGutter key={`${name}-${env}`}>
                  <SplitItem>
                    <YellowExclamationTriangleIcon />
                  </SplitItem>
                  <SplitItem isFilled>{env}</SplitItem>
                  <SplitItem>{t('gitops-plugin~OutOfSync')}</SplitItem>
                </Split>
              ))}
              count={outOfSyncEnvs.length}
              icon="exclamation"
            />
            <GitOpsSyncFragment
              tooltip={unknownEnvs.map((env) => (
                <Split className="gop-gitops-tooltip-text" hasGutter key={`${name}-${env}`}>
                  <SplitItem>
                    <GrayUnknownIcon />
                  </SplitItem>
                  <SplitItem isFilled>{env}</SplitItem>
                  <SplitItem>{t('gitops-plugin~Unknown')}</SplitItem>
                </Split>
              ))}
              count={unknownEnvs.length}
              icon="unknown"
            />
          </Flex>
        ) : (
          <span>{envs.join(', ')}</span>
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {latestDeployedTime !== '' ? (
          <Flex>
            <FlexItem className="gop-gitops-lastDeploymentTime" spacer={{ default: 'spacerXs' }}>
              <span>
                <Timestamp timestamp={latestDeployedTime} />
              </span>
            </FlexItem>
            <FlexItem>({latestDeployedEnv})</FlexItem>
          </Flex>
        ) : (
          <span>-</span>
        )}
      </TableData>
    </>
  );
};

export default GitOpsTableRow;
