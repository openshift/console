import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import { resourcePath } from './utils';
import { fromNow } from './utils/datetime';
import { K8sResourceKind } from '../module/k8s';

const getBuildNumber = (resource: K8sResourceKind): number => _.get(resource, ['metadata', 'annotations', 'openshift.io/build.number']);
const getStages = (status): any[] => (status && status.stages) || [];
const getJenkinsStatus = (resource: K8sResourceKind) => {
  const json = _.get(resource, ['metadata', 'annotations', 'openshift.io/jenkins-status-json']);
  if (!json) {
    return {};
  }

  const status = _.attempt(JSON.parse, json);
  return _.isError(status) ? {} : status;
};

export const getJenkinsLogURL = (resource: K8sResourceKind): string => _.get(resource, ['metadata', 'annotations', 'openshift.io/jenkins-console-log-url']);
export const getJenkinsBuildURL = (resource: K8sResourceKind): string => _.get(resource, ['metadata', 'annotations', 'openshift.io/jenkins-build-uri']);

const BuildSummaryStatusIcon: React.SFC<BuildSummaryStatusIconProps> = ({ status }) => {
  const statusClass = _.lowerCase(status);
  const icon = ({
    new: 'fa-hourglass-o',
    pending: 'fa-hourglass-half',
    running: 'fa-refresh fa-spin',
    complete: 'fa-check-circle',
    failed: 'fa-times-circle'
  })[statusClass];

  return icon
    ? <span className={`build-pipeline__status-icon build-pipeline__status-icon--${statusClass}`}>
      <span className={`fa ${icon} fa-fw`} aria-hidden="true"></span>
    </span>
    : <span className="build-pipeline__status-icon">
      <span className="fa fa-refresh fa-spin" aria-hidden="true"></span>
    </span>;
};

const BuildLogLink: React.SFC<BuildLogLinkProps> = ({ obj }) => {
  const link = getJenkinsLogURL(obj);
  return link
    ? <div className="build-pipeline__link">
      <a href={link} className="build-pipeline__log-link" target="_blank" rel="noopener noreferrer">View Log</a>
    </div>
    : null;
};

const StagesNotStarted: React.SFC = () => <div className="build-pipeline__stage build-pipeline__stage--none">
  No stages have started.
</div>;

const BuildSummaryTimestamp: React.SFC<BuildSummaryTimestampProps> = ({ timestamp }) => <span className="build-pipeline__timestamp text-muted">
  {fromNow(timestamp)}
</span>;

const BuildPipelineSummary: React.SFC<BuildPipelineSummaryProps> = ({ obj }) => {
  const { name, namespace } = obj.metadata;
  const buildNumber = getBuildNumber(obj);
  const path: string = resourcePath(obj.kind, name, namespace);
  return <div className="build-pipeline__summary">
    <div className="build-pipeline__phase">
      <BuildSummaryStatusIcon status={obj.status.phase} /> <Link to={path} title={name}>Build {buildNumber}</Link>
    </div>
    <BuildSummaryTimestamp timestamp={obj.metadata.creationTimestamp} />
    <BuildLogLink obj={obj} />
  </div>;
};

const BuildAnimation: React.SFC<BuildAnimationProps> = ({ status }) => <div className={`build-pipeline__status-bar build-pipeline__status-bar--${_.kebabCase(status)}`}>
  <div className="build-pipeline__animation-line"></div>
  <div className="build-pipeline__animation-circle">
    <div className="build-pipeline__circle-clip1"></div>
    <div className="build-pipeline__circle-clip2"></div>
    <div className="build-pipeline__circle-inner">
      <div className="build-pipeline__circle-inner-fill"></div>
    </div>
  </div>
</div>;

const JenkinsInputUrl: React.SFC<JenkinsInputUrlProps> = ({ obj, stage }) => {
  const pending = stage.status === 'PAUSED_PENDING_INPUT';

  if (!pending) {
    return null;
  }

  const buildUrl = getJenkinsBuildURL(obj);
  return <div className="build-pipeline__stage-actions text-muted">
    <a href={buildUrl} target="_blank" rel="noopener noreferrer">Input Required</a>
  </div>;
};

const BuildStageTimestamp: React.SFC<BuildStageTimestampProps> = ({ timestamp }) => <div className="build-pipeline__stage-time text-muted">
  {fromNow(timestamp)}
</div>;

const BuildStageName: React.SFC<BuildStageNameProps> = ({ name }) => {
  return <div title={name} className="build-pipeline__stage-name">
    {name}
  </div>;
};

const BuildStage: React.SFC<BuildStageProps> = ({ obj, stage }) => {
  return <div className="build-pipeline__stage">
    <div className="build-pipeline__stage-column">
      <BuildStageName name={stage.name} />
      <BuildAnimation status={stage.status} />
      <JenkinsInputUrl obj={obj} stage={stage} />
      <BuildStageTimestamp timestamp={stage.startTimeMillis} />
    </div>
  </div>;
};

export const BuildPipeline: React.SFC<BuildPipelineProps> = ({ obj }) => {
  const jenkinsStatus: any = getJenkinsStatus(obj);
  const stages = getStages(jenkinsStatus);
  return <div className="build-pipeline">
    <BuildPipelineSummary obj={obj} />
    <div className="build-pipeline__container">
      <div className="build-pipeline__stages">
        {_.isEmpty(stages)
          ? <StagesNotStarted />
          : stages.map(stage => <BuildStage obj={obj} stage={stage} key={stage.id} />)}
      </div>
    </div>
  </div>;
};

/* eslint-disable no-undef */
export type BuildPipelineProps = {
  obj: K8sResourceKind,
};

export type BuildStageProps = {
  obj: K8sResourceKind,
  stage: any,
};

export type BuildAnimationProps = {
  status: string,
};

export type BuildPipelineSummaryProps = {
  obj: K8sResourceKind,
};

export type BuildSummaryStatusIconProps = {
  status: string,
};

export type BuildStageTimestampProps = {
  timestamp: string,
};

export type BuildLogLinkProps = {
  obj: K8sResourceKind,
};

export type BuildSummaryTimestampProps = {
  timestamp: string,
};

export type BuildStageNameProps = {
  name: string,
};

export type JenkinsInputUrlProps = {
  obj: K8sResourceKind,
  stage: any,
};
/* eslint-disable no-undef */
