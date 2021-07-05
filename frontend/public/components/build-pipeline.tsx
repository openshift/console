import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import { BanIcon, PendingIcon, SyncAltIcon } from '@patternfly/react-icons';

import { resourcePath, ExternalLink } from './utils';
import { fromNow } from './utils/datetime';
import { K8sResourceKind } from '../module/k8s';
import { getBuildNumber } from '../module/k8s/builds';
import { GreenCheckCircleIcon, RedExclamationCircleIcon } from '@console/dynamic-plugin-sdk';

const getStages = (status): any[] => (status && status.stages) || [];
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

const BuildSummaryStatusIcon: React.SFC<BuildSummaryStatusIconProps> = ({ status }) => {
  const statusClass = _.lowerCase(status);
  const icon = {
    new: '',
    pending: <PendingIcon />,
    running: <SyncAltIcon className="fa-spin" />,
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

export const BuildPipelineLogLink: React.SFC<BuildPipelineLogLinkProps> = ({ obj }) => {
  const link = getJenkinsLogURL(obj);
  return link ? (
    <ExternalLink href={link} text="View logs" additionalClassName="build-pipeline__log-link" />
  ) : null;
};

const StagesNotStarted: React.SFC = () => (
  <div className="build-pipeline__stage build-pipeline__stage--none">No stages have started.</div>
);

const BuildSummaryTimestamp: React.SFC<BuildSummaryTimestampProps> = ({ timestamp }) => (
  <span className="build-pipeline__timestamp text-muted">{fromNow(timestamp)}</span>
);

const BuildPipelineSummary: React.SFC<BuildPipelineSummaryProps> = ({ obj }) => {
  const { name, namespace } = obj.metadata;
  const buildNumber = getBuildNumber(obj);
  const path: string = resourcePath(obj.kind, name, namespace);
  return (
    <div className="build-pipeline__summary">
      <div className="build-pipeline__phase">
        <BuildSummaryStatusIcon status={obj.status.phase} />{' '}
        <Link to={path} title={name}>
          Build {buildNumber}
        </Link>
      </div>
      <BuildSummaryTimestamp timestamp={obj.metadata.creationTimestamp} />
      <BuildPipelineLogLink obj={obj} />
    </div>
  );
};

const BuildAnimation: React.SFC<BuildAnimationProps> = ({ status }) => (
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

const JenkinsInputUrl: React.SFC<JenkinsInputUrlProps> = ({ obj, stage }) => {
  const pending = stage.status === 'PAUSED_PENDING_INPUT';

  if (!pending) {
    return null;
  }

  const buildUrl = getJenkinsBuildURL(obj);
  return (
    <div className="build-pipeline__stage-actions text-muted">
      <ExternalLink href={buildUrl} text="Input Required" />
    </div>
  );
};

const BuildStageTimestamp: React.SFC<BuildStageTimestampProps> = ({ timestamp }) => (
  <div className="build-pipeline__stage-time text-muted">{fromNow(timestamp)}</div>
);

const BuildStageName: React.SFC<BuildStageNameProps> = ({ name }) => {
  return (
    <div title={name} className="build-pipeline__stage-name">
      {name}
    </div>
  );
};

const BuildStage: React.SFC<BuildStageProps> = ({ obj, stage }) => {
  return (
    <div className="build-pipeline__stage">
      <div className="build-pipeline__stage-column">
        <BuildStageName name={stage.name} />
        <BuildAnimation status={stage.status} />
        <JenkinsInputUrl obj={obj} stage={stage} />
        <BuildStageTimestamp timestamp={stage.startTimeMillis} />
      </div>
    </div>
  );
};

export const BuildPipeline: React.SFC<BuildPipelineProps> = ({ obj }) => {
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
  stage: any;
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
  timestamp: string;
};

export type BuildPipelineLogLinkProps = {
  obj: K8sResourceKind;
};

export type BuildPipelineLinkProps = {
  obj: K8sResourceKind;
  title: string;
};

export type BuildSummaryTimestampProps = {
  timestamp: string;
};

export type BuildStageNameProps = {
  name: string;
};

export type JenkinsInputUrlProps = {
  obj: K8sResourceKind;
  stage: any;
};
