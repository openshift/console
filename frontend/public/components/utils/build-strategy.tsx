import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, K8sResourceKindReference } from '../../module/k8s';
import { ResourceLink } from './';
import { getStrategyType } from '../build';

const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';

export const BuildStrategy: React.SFC<BuildStrategyProps> = ({ resource, children }) => {
  const strategy = _.get(resource, 'spec.strategy', {});
  const git = _.get(resource, 'spec.source.git');
  const gitRef = _.get(resource, 'spec.source.git.ref');
  const contextDir = _.get(resource, 'spec.source.contextDir');
  const dockerfile = _.get(resource, 'spec.source.dockerfile');
  const asFile = _.get(resource, 'spec.source.binary.asFile');
  const jenkinsfile = _.get(resource, 'spec.strategy.jenkinsPipelineStrategy.jenkinsfile');
  const jenkinsfilePath = _.get(resource, 'spec.strategy.jenkinsPipelineStrategy.jenkinsfilePath');
  const strategyType = getStrategyType(resource.spec.strategy.type);
  const buildFrom = _.get(resource, `spec.strategy[${strategyType}].from`);
  const outputTo = _.get(resource, 'spec.output.to');
  const commitMessage = _.get(resource, 'spec.revision.git.message');
  const commitHash = _.get(resource, 'spec.revision.git.commit');
  const commitAuthorName = _.get(resource, 'spec.revision.git.author.name');
  const pushSecret = _.get(resource, 'spec.output.pushSecret');
  const resourceLimits = _.get(resource, 'spec.resources.limits');
  const triggers = _.map(resource.spec.triggers, 'type').join(', ');

  return <dl className="co-m-pane__details">
    {children}
    <dt>Type</dt>
    <dd>{strategy.type}</dd>
    {git && <dt>Git Repository</dt>}
    {git && <dd>{git.uri}</dd>}
    {gitRef && <dt>Git Ref</dt>}
    {gitRef && <dd>{gitRef}</dd>}
    {commitMessage && <dt>Git Commit</dt>}
    {commitMessage && <dd>{commitMessage}<br />{commitHash && <code>{commitHash.substring(0,7)}</code>} {commitAuthorName && `by ${commitAuthorName}`}</dd>}
    {asFile && <dt>Binary Input as File</dt>}
    {asFile && <dd>{asFile}</dd>}
    {contextDir && <dt>Context Dir</dt>}
    {contextDir && <dd>{contextDir}</dd>}
    {dockerfile && <dt>Dockerfile</dt>}
    {dockerfile && <dd><pre>{dockerfile}</pre></dd>}
    {jenkinsfile && <dt>Jenkinsfile</dt>}
    {jenkinsfile && <dd><pre>{jenkinsfile}</pre></dd>}
    {jenkinsfilePath && <dt>Jenkinsfile Path</dt>}
    {jenkinsfilePath && <dd>{jenkinsfilePath}</dd>}
    {buildFrom && (buildFrom.kind === 'ImageStreamTag' || buildFrom.kind === 'DockerImage') && <dt>Builder Image</dt>}
    {buildFrom && buildFrom.kind === 'ImageStreamTag' && <dd>
      <ResourceLink kind={ImageStreamTagsReference} name={buildFrom.name} namespace={buildFrom.namespace || resource.metadata.namespace} title={buildFrom.name} />
    </dd>}
    {buildFrom && buildFrom.kind === 'DockerImage' && <dd>{buildFrom.name}</dd>}
    {outputTo && <dt>Output To</dt>}
    {outputTo && <dd>
      <ResourceLink kind={ImageStreamTagsReference} name={outputTo.name} namespace={outputTo.namespace || resource.metadata.namespace} title={outputTo.name} />
    </dd>}
    {pushSecret && <dt>Push Secret</dt>}
    {pushSecret && <dd><ResourceLink kind="Secret" name={pushSecret.name} namespace={resource.metadata.namespace} title={pushSecret.name} /></dd>}
    <dt>Run Policy</dt>
    <dd>{resource.spec.runPolicy || 'Serial'}</dd>
    {resourceLimits && <dt>Resource Limits</dt>}
    {resourceLimits && <dd>{_.map(resourceLimits, (v, k) => `${k}: ${v}`).join(', ')}</dd>}
    {triggers && <dt>Triggers</dt>}
    {triggers && <dd>{triggers}</dd>}
  </dl>;
};

/* eslint-disable no-undef */
export type BuildStrategyProps = {
  resource: K8sResourceKind;
  children?: JSX.Element[];
};
/* eslint-enable no-undef */

BuildStrategy.displayName = 'BuildStrategy';
