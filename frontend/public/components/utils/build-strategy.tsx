import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsItem } from './details-item';
import { ResourceLink } from './resource-link';
import { getStrategyType } from '../build';

const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';

export const BuildStrategy: React.SFC<BuildStrategyProps> = ({ resource, children }) => {
  const dockerfile = _.get(resource, 'spec.source.dockerfile');
  const jenkinsfile = _.get(resource, 'spec.strategy.jenkinsPipelineStrategy.jenkinsfile');
  const strategyType = getStrategyType(resource.spec.strategy.type);
  const buildFromPath = ['spec', 'strategy', strategyType, 'from'];
  const buildFrom = _.get(resource, buildFromPath);
  const outputTo = _.get(resource, 'spec.output.to');
  const commitMessage = _.get(resource, 'spec.revision.git.message');
  const commitHash = _.get(resource, 'spec.revision.git.commit');
  const commitAuthorName = _.get(resource, 'spec.revision.git.author.name');
  const pushSecret = _.get(resource, 'spec.output.pushSecret');
  const resourceLimits = _.get(resource, 'spec.resources.limits');
  const triggers = _.map(resource.spec.triggers, 'type').join(', ');

  return (
    <dl className="co-m-pane__details">
      {children}
      <DetailsItem label="Type" obj={resource} path="spec.strategy.type" />
      <DetailsItem label="Git Repository" obj={resource} path="spec.source.git.uri" hideEmpty />
      <DetailsItem label="Git Ref" obj={resource} path="spec.source.git.ref" hideEmpty />
      {commitMessage && (
        <DetailsItem label="Git Commit" obj={resource} path="spec.revision.git.message">
          {commitMessage}
          <br />
          {commitHash && <code>{commitHash.substring(0, 7)}</code>}{' '}
          {commitAuthorName && `by ${commitAuthorName}`}
        </DetailsItem>
      )}
      <DetailsItem label="Binary File" obj={resource} path="spec.source.binary.asFile" hideEmpty />
      <DetailsItem label="Context Dir" obj={resource} path="spec.source.contextDir" hideEmpty />
      {dockerfile && (
        <DetailsItem label="Dockerfile" obj={resource} path="spec.source.dockerfile">
          <pre>{dockerfile}</pre>
        </DetailsItem>
      )}
      {jenkinsfile && (
        <DetailsItem
          label="Dockerfile"
          obj={resource}
          path="spec.strategy.jenkinsPipelineStrategy.jenkinsfile"
        >
          <pre>{jenkinsfile}</pre>
        </DetailsItem>
      )}
      <DetailsItem
        label="JenskinsFile Path"
        obj={resource}
        path="spec.strategy.jenkinsPipelineStrategy.jenkinsfilePath"
        hideEmpty
      />
      {buildFrom && buildFrom.kind === 'ImageStreamTag' && (
        <DetailsItem label="Build From" obj={resource} path={buildFromPath}>
          <ResourceLink
            kind={ImageStreamTagsReference}
            name={buildFrom.name}
            namespace={buildFrom.namespace || resource.metadata.namespace}
            title={buildFrom.name}
          />
        </DetailsItem>
      )}
      {buildFrom && buildFrom.kind === 'DockerImage' && (
        <DetailsItem label="Build From" obj={resource} path={buildFromPath}>
          {buildFrom.name}
        </DetailsItem>
      )}
      {outputTo && (
        <DetailsItem label="Output To" obj={resource} path="spec.output.to">
          <ResourceLink
            kind={ImageStreamTagsReference}
            name={outputTo.name}
            namespace={outputTo.namespace || resource.metadata.namespace}
            title={outputTo.name}
          />
        </DetailsItem>
      )}
      {pushSecret && (
        <DetailsItem label="Push Secret" obj={resource} path="spec.output.pushSecret">
          <ResourceLink
            kind="Secret"
            name={pushSecret.name}
            namespace={resource.metadata.namespace}
            title={pushSecret.name}
          />
        </DetailsItem>
      )}
      <DetailsItem label="Run Policy" obj={resource} path="spec.runPolicy" hideEmpty />
      {resourceLimits && (
        <DetailsItem label="Resource Limits" obj={resource} path="spec.resources.limits">
          {_.map(resourceLimits, (v, k) => `${k}: ${v}`).join(', ')}
        </DetailsItem>
      )}
      {triggers && (
        <DetailsItem label="Triggers" obj={resource} path="spec.triggers">
          {triggers}
        </DetailsItem>
      )}
    </dl>
  );
};

export type BuildStrategyProps = {
  resource: K8sResourceKind;
  children?: JSX.Element[];
};

BuildStrategy.displayName = 'BuildStrategy';
