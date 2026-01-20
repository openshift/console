import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import * as _ from 'lodash';
import { BanIcon } from '@patternfly/react-icons/dist/esm/icons/ban-icon';
import { PendingIcon } from '@patternfly/react-icons/dist/esm/icons/pending-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { resourcePath } from './utils/resource-link';
import { fromNow } from './utils/datetime';
import { K8sResourceKind } from '../module/k8s';
import { getBuildNumber } from '../module/k8s/builds';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
} from '@console/shared/src/components/status/icons';

type BuildStageData = {
  id: string;
  name: string;
  status: string;
  startTimeMillis: number;
};

const getStages = (status): BuildStageData[] => (status && status.stages) || [];
const getJenkinsStatus = (resource: K8sResourceKind) => {
  const json = _.get(resource, ['metadata', 'annotations', 'openshift.io/jenkins-status-json']);
  if (!json) {
    return {};
  }

  const status = _.attempt(JSON.parse, json);
  return _.isError(status) ? {} : status;
};

export const getJenkinsLogURL = (resource: K8sResourceKind): string =>
  _.get(resource, ['metadata', 'annotations', 'openshift.io/jenkins-console-log-url']);
export const getJenkinsBuildURL = (resource: K8sResourceKind): string =>
  _.get(resource, ['metadata', 'annotations', 'openshift.io/jenkins-build-uri']);

const BuildSummaryStatusIcon: FC<BuildSummaryStatusIconProps> = ({ status }) => {
  const statusClass = _.lowerCase(status);
  const icon = {
    new: '',
    pending: <PendingIcon />,
    running: <SyncAltIcon className="co-spin" />,
    complete: <GreenCheckCircleIcon />,
    failed: <RedExclamationCircleIcon />,
    cancelled: <BanIcon />,
  }[statusClass];

  return icon ? (
    <span className={`build-pipeline__status-icon build-pipeline__status-icon--${statusClass}`}>
      {icon}
    </span>
  ) : null;
};

export const BuildPipelineLogLink: FC<BuildPipelineLogLinkProps> = ({ obj }) => {
  const { t } = useTranslation();
  const link = getJenkinsLogURL(obj);
  return link ? (
    <ExternalLink href={link} text={t('public~View logs')} className="build-pipeline__log-link" />
  ) : null;
};

const StagesNotStarted: FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <div className="build-pipeline__stage build-pipeline__stage--none">
      {t('public~No stages have started.')}
    </div>
  );
};

const BuildSummaryTimestamp: FC<BuildSummaryTimestampProps> = ({ timestamp }) => (
  <span className="build-pipeline__timestamp pf-v6-u-text-color-subtle">
    {fromNow(typeof timestamp === 'string' ? timestamp : timestamp)}
  </span>
);

const BuildPipelineSummary: FC<BuildPipelineSummaryProps> = ({ obj }) => {
  const { name, namespace } = obj.metadata;
  const buildNumber = getBuildNumber(obj);
  const path: string = resourcePath(obj.kind, name, namespace);
  const { t } = useTranslation();
  return (
    <div className="build-pipeline__summary">
      <div className="build-pipeline__phase">
        <BuildSummaryStatusIcon status={obj.status.phase} />{' '}
        <Link to={path} title={name}>
          {t('public~Build {{buildNumber}}', { buildNumber })}
        </Link>
      </div>
      <BuildSummaryTimestamp timestamp={obj.metadata.creationTimestamp} />
      <BuildPipelineLogLink obj={obj} />
    </div>
  );
};

const BuildAnimation: FC<BuildAnimationProps> = ({ status }) => (
  <div className={`build-pipeline__status-bar build-pipeline__status-bar--${_.kebabCase(status)}`}>
    <div className="build-pipeline__animation-line" />
    <div className="build-pipeline__animation-circle">
      <div className="build-pipeline__circle-clip1" />
      <div className="build-pipeline__circle-clip2" />
      <div className="build-pipeline__circle-inner">
        <div className="build-pipeline__circle-inner-fill" />
      </div>
    </div>
  </div>
);

const JenkinsInputUrl: FC<JenkinsInputUrlProps> = ({ obj, stage }) => {
  const pending = stage.status === 'PAUSED_PENDING_INPUT';
  const { t } = useTranslation();

  if (!pending) {
    return null;
  }

  const buildUrl = getJenkinsBuildURL(obj);
  return (
    <div className="build-pipeline__stage-actions pf-v6-u-text-color-subtle">
      <ExternalLink href={buildUrl} text={t('public~Input required')} />
    </div>
  );
};

const BuildStageTimestamp: FC<BuildStageTimestampProps> = ({ timestamp }) => (
  <div className="build-pipeline__stage-time pf-v6-u-text-color-subtle">
    {fromNow(typeof timestamp === 'string' ? timestamp : timestamp)}
  </div>
);

const BuildStageName: FC<BuildStageNameProps> = ({ name }) => {
  return (
    <div title={name} className="build-pipeline__stage-name">
      {name}
    </div>
  );
};

const BuildStage: FC<BuildStageProps> = ({ obj, stage }) => {
  return (
    <div className="build-pipeline__stage">
      <div className="build-pipeline__stage-column">
        <BuildStageName name={stage.name} />
        <BuildAnimation status={stage.status} />
        <JenkinsInputUrl obj={obj} stage={stage} />
        <BuildStageTimestamp timestamp={stage.startTimeMillis.toString()} />
      </div>
    </div>
  );
};

export const BuildPipeline: FC<BuildPipelineProps> = ({ obj }) => {
  const jenkinsStatus: any = getJenkinsStatus(obj);
  const stages = getStages(jenkinsStatus);
  return (
    <div className="build-pipeline">
      <BuildPipelineSummary obj={obj} />
      <div className="build-pipeline__container">
        <div className="build-pipeline__stages">
          {_.isEmpty(stages) ? (
            <StagesNotStarted />
          ) : (
            stages.map((stage) => <BuildStage obj={obj} stage={stage} key={stage.id} />)
          )}
        </div>
      </div>
    </div>
  );
};

export type BuildPipelineProps = {
  obj: K8sResourceKind;
};

export type BuildStageProps = {
  obj: K8sResourceKind;
  stage: BuildStageData;
};

export type BuildAnimationProps = {
  status: string;
};

export type BuildPipelineSummaryProps = {
  obj: K8sResourceKind;
};

export type BuildSummaryStatusIconProps = {
  status: string;
};

export type BuildStageTimestampProps = {
  timestamp: string | undefined;
};

export type BuildPipelineLogLinkProps = {
  obj: K8sResourceKind;
};

export type BuildPipelineLinkProps = {
  obj: K8sResourceKind;
  title: string;
};

export type BuildSummaryTimestampProps = {
  timestamp: string | undefined;
};

export type BuildStageNameProps = {
  name: string;
};

export type JenkinsInputUrlProps = {
  obj: K8sResourceKind;
  stage: any;
};
