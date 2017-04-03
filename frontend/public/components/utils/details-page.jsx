import React from 'react';

import { Cog, kindObj, LabelList, Selector, Timestamp } from './index';

export const pluralize = (i, singular, plural = `${singular}s`) => `${i || 0} ${i === 1 ? singular : plural}`;

export const detailsPage = (Component) => (props) =>
  <div className="row row-gutter">
    <Component {...props} />
  </div>;

export const Heading = ({text}) => <div className="co-m-pane__heading">
  <h1 className="co-m-pane__title">{text}</h1>
</div>;

export const ResourceSummary = ({children, resource, showPodSelector = true, showNodeSelector = true}) => <dl>
  <dt>Name</dt>
  <dd>{resource.metadata.name || '-'}</dd>
  <dt>Labels</dt>
  <dd><LabelList kind={resource.kind.toLowerCase()} labels={resource.metadata.labels} /></dd>
  {showPodSelector && <dt>Pod Selector</dt>}
  {showPodSelector && <dd><Selector selector={resource.spec.selector} /></dd>}
  {showNodeSelector && <dt>Node Selector</dt>}
  {showNodeSelector && <dd><Selector kind="node" selector={_.get(resource, 'spec.template.spec.nodeSelector')} /></dd>}
  <dt>Annotations</dt>
  <dd><a className="co-m-modal-link" onClick={Cog.factory.ModifyAnnotations(kindObj(resource.kind), resource).callback}>{pluralize(_.size(resource.metadata.annotations), 'Annotation')}</a></dd>
  {children}
  <dt>Created At</dt>
  <dd><Timestamp timestamp={resource.metadata.creationTimestamp} /></dd>
</dl>;

export const ResourcePodCount = ({resource}) => <dl>
  <dt>Current Count</dt>
  <dd>{resource.status.replicas || 0}</dd>
  <dt>Desired Count</dt>
  <dd>{resource.spec.replicas || 0}</dd>
</dl>;
