import * as React from 'react';
import * as _ from 'lodash-es';

import { Kebab, LabelList, ResourceLink, Selector, Timestamp } from './index';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  referenceForOwnerRef,
  Toleration,
} from '../../module/k8s';

export const pluralize = (i: number, singular: string, plural: string = `${singular}s`) => `${i || 0} ${i === 1 ? singular : plural}`;

export const detailsPage = <T extends {}>(Component: React.ComponentType<T>) => function DetailsPage(props: T) {
  return <Component {...props} />;
};

const getTolerations = (obj: K8sResourceKind): Toleration[] => {
  // FIXME: Is this correct for all types (jobs, cron jobs)? It would be better for the embedding page to pass in the path.
  return obj.kind === 'Pod'
    ? _.get(obj, 'spec.tolerations')
    : _.get(obj, 'spec.template.spec.tolerations');
};

export const ResourceSummary: React.SFC<ResourceSummaryProps> = ({children, resource, showPodSelector = false, showNodeSelector = false, showAnnotations = true, showTolerations = false, podSelector = 'spec.selector'}) => {
  const { metadata, type } = resource;
  const reference = referenceFor(resource);
  const model = modelFor(reference);
  const owners = (_.get(metadata, 'ownerReferences') || [])
    .map((o, i) => <ResourceLink key={i} kind={referenceForOwnerRef(o)} name={o.name} namespace={metadata.namespace} title={o.uid} />);
  const tolerations = showTolerations ? getTolerations(resource) : null;

  return <dl data-test-id="resource-summary" className="co-m-pane__details">
    <dt>Name</dt>
    <dd>{metadata.name || '-'}</dd>
    { metadata.namespace ? <dt>Namespace</dt> : null }
    { metadata.namespace ? <dd><ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.uid} namespace={null} /></dd> : null }
    { type ? <dt>Type</dt> : null }
    { type ? <dd>{type}</dd> : null }
    <dt>Labels</dt>
    <dd><LabelList kind={reference} labels={metadata.labels} /></dd>
    {showPodSelector && <dt>Pod Selector</dt>}
    {showPodSelector && <dd><Selector selector={_.get(resource, podSelector)} namespace={_.get(resource, 'metadata.namespace')} /></dd>}
    {showNodeSelector && <dt>Node Selector</dt>}
    {showNodeSelector && <dd><Selector kind="Node" selector={_.get(resource, 'spec.template.spec.nodeSelector')} /></dd>}
    {showTolerations && <dt>Tolerations</dt>}
    {showTolerations && <dd><button type="button" className="btn btn-link co-modal-btn-link co-modal-btn-link--left" onClick={Kebab.factory.ModifyTolerations(model, resource).callback}>{pluralize(_.size(tolerations), 'Toleration')}</button></dd>}
    {showAnnotations && <dt>Annotations</dt>}
    {showAnnotations && <dd><button data-test-id="edit-annotations" type="button" className="btn btn-link co-modal-btn-link co-modal-btn-link--left" onClick={Kebab.factory.ModifyAnnotations(model, resource).callback}>{pluralize(_.size(metadata.annotations), 'Annotation')}</button></dd>}
    {children}
    <dt>Created At</dt>
    <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
    { owners.length ? <dt>{pluralize(owners.length, 'Owner')}</dt> : null }
    { owners.length ? <dd>{ owners }</dd> : null }
  </dl>;
};

export const ResourcePodCount: React.SFC<ResourcePodCountProps> = ({resource}) => <dl>
  <dt>Current Count</dt>
  <dd>{resource.status.replicas || 0}</dd>
  <dt>Desired Count</dt>
  <dd>{resource.spec.replicas || 0}</dd>
</dl>;

export type ResourceSummaryProps = {
  resource: K8sResourceKind;
  showPodSelector?: boolean;
  showNodeSelector?: boolean;
  showAnnotations?: boolean;
  showTolerations?: boolean;
  podSelector?: string;
  children?: React.ReactNode;
};

export type ResourcePodCountProps = {
  resource: K8sResourceKind;
};

ResourceSummary.displayName = 'ResourceSummary';
ResourcePodCount.displayName = 'ResourcePodCount';
