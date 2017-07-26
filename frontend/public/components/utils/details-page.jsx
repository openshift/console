import _ from 'lodash';
import React from 'react';

import { Cog, kindObj, LabelList, ResourceLink, Selector, Timestamp } from './index';

export const pluralize = (i, singular, plural = `${singular}s`) => `${i || 0} ${i === 1 ? singular : plural}`;

// eslint-disable-next-line react/display-name
export const detailsPage = Component => props =>
  <div className="row row-gutter">
    <Component {...props} />
  </div>;

export const Heading = ({text}) => <div className="co-m-pane__heading">
  <h1 className="co-m-pane__title">{text}</h1>
</div>;

export const ResourceSummary = ({children, resource, showPodSelector = true, showNodeSelector = true, podSelector = 'spec.selector'}) => {
  const { metadata } = resource;
  const owners = _.get(metadata, 'ownerReferences', [])
    .map((o, i) => <ResourceLink key={i} kind={o.kind} name={o.name} namespace={metadata.namespace}/>);

  return <dl>
    <dt>Name</dt>
    <dd>{metadata.name || '-'}</dd>
    <dt>Labels</dt>
    <dd><LabelList kind={resource.kind} labels={metadata.labels} /></dd>
    {showPodSelector && <dt>Pod Selector</dt>}
    {showPodSelector && <dd><Selector selector={_.get(resource, podSelector)} /></dd>}
    {showNodeSelector && <dt>Node Selector</dt>}
    {showNodeSelector && <dd><Selector kind="Node" selector={_.get(resource, 'spec.template.spec.nodeSelector')} /></dd>}
    <dt>Annotations</dt>
    <dd><a className="co-m-modal-link" onClick={Cog.factory.ModifyAnnotations(kindObj(resource.kind), resource).callback}>{pluralize(_.size(metadata.annotations), 'Annotation')}</a></dd>
    {children}
    <dt>Created At</dt>
    <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
    { owners.length ? <dt>{pluralize(owners.length, 'Owner')}</dt> : null}
    { owners.length ? <dd>{ owners }</dd> : null }
  </dl>;
};

export const ResourcePodCount = ({resource}) => <dl>
  <dt>Current Count</dt>
  <dd>{resource.status.replicas || 0}</dd>
  <dt>Desired Count</dt>
  <dd>{resource.spec.replicas || 0}</dd>
</dl>;
