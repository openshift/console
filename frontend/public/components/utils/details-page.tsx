import * as React from 'react';
import * as _ from 'lodash-es';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';

import {
  DetailsItem,
  Kebab,
  LabelList,
  OwnerReferences,
  ResourceLink,
  Selector,
  Timestamp,
  useAccessReview,
} from './index';
import { K8sResourceKind, modelFor, referenceFor, Toleration } from '../../module/k8s';

export const pluralize = (
  i: number,
  singular: string,
  plural: string = `${singular}s`,
  includeCount: boolean = true,
) => {
  const pluralized = `${i === 1 ? singular : plural}`;
  return includeCount ? `${i || 0} ${pluralized}` : pluralized;
};

export const detailsPage = <T extends {}>(Component: React.ComponentType<T>) =>
  function DetailsPage(props: T) {
    return <Component {...props} />;
  };

const getTolerationsPath = (obj: K8sResourceKind): string => {
  // FIXME: Is this correct for all types (jobs, cron jobs)? It would be better for the embedding page to pass in the path.
  return obj.kind === 'Pod' ? 'spec.tolerations' : 'spec.template.spec.tolerations';
};

const getNodeSelectorPath = (obj: K8sResourceKind): string => {
  // FIXME: Is this correct for all types (jobs, cron jobs)? It would be better for the embedding page to pass in the path.
  return obj.kind === 'Pod' ? 'spec.nodeSelector' : 'spec.template.spec.nodeSelector';
};

export const ResourceSummary: React.SFC<ResourceSummaryProps> = ({
  children,
  resource,
  customPathName,
  showPodSelector = false,
  showNodeSelector = false,
  showAnnotations = true,
  showTolerations = false,
  podSelector = 'spec.selector',
}) => {
  const { metadata, type } = resource;
  const reference = referenceFor(resource);
  const model = modelFor(reference);
  const nodeSelectorPath = getNodeSelectorPath(resource);
  const tolerationsPath = getTolerationsPath(resource);
  const tolerations: Toleration[] = _.get(resource, tolerationsPath);

  const canUpdate = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'patch',
    name: metadata.name,
    namespace: metadata.namespace,
  });

  return (
    <dl data-test-id="resource-summary" className="co-m-pane__details">
      <DetailsItem label="Name" obj={resource} path={customPathName || 'metadata.name'} />
      {metadata.namespace && (
        <DetailsItem label="Namespace" obj={resource} path="metadata.namespace">
          <ResourceLink
            kind="Namespace"
            name={metadata.namespace}
            title={metadata.uid}
            namespace={null}
          />
        </DetailsItem>
      )}
      {type ? <dt>Type</dt> : null}
      {type ? <dd>{type}</dd> : null}
      <DetailsItem label="Labels" obj={resource} path="metadata.labels">
        <LabelList kind={reference} labels={metadata.labels} />
      </DetailsItem>
      {showPodSelector && (
        <DetailsItem label="Pod Selector" obj={resource} path={podSelector}>
          <Selector
            selector={_.get(resource, podSelector)}
            namespace={_.get(resource, 'metadata.namespace')}
          />
        </DetailsItem>
      )}
      {showNodeSelector && (
        <DetailsItem label="Node Selector" obj={resource} path={nodeSelectorPath}>
          <Selector kind="Node" selector={_.get(resource, nodeSelectorPath)} />
        </DetailsItem>
      )}
      {showTolerations && (
        <DetailsItem label="Tolerations" obj={resource} path={tolerationsPath}>
          {canUpdate ? (
            <Button
              type="button"
              isInline
              onClick={Kebab.factory.ModifyTolerations(model, resource).callback}
              variant="link"
            >
              {pluralize(_.size(tolerations), 'Toleration')}
              <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
            </Button>
          ) : (
            pluralize(_.size(tolerations), 'Toleration')
          )}
        </DetailsItem>
      )}
      {showAnnotations && (
        <DetailsItem label="Annotations" obj={resource} path="metadata.annotations">
          {canUpdate ? (
            <Button
              data-test-id="edit-annotations"
              type="button"
              isInline
              onClick={Kebab.factory.ModifyAnnotations(model, resource).callback}
              variant="link"
            >
              {pluralize(_.size(metadata.annotations), 'Annotation')}
              <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
            </Button>
          ) : (
            pluralize(_.size(metadata.annotations), 'Annotation')
          )}
        </DetailsItem>
      )}
      {children}
      <DetailsItem label="Created At" obj={resource} path="metadata.creationTimestamp">
        <Timestamp timestamp={metadata.creationTimestamp} />
      </DetailsItem>
      <DetailsItem label="Owner" obj={resource} path="metadata.ownerReferences">
        <OwnerReferences resource={resource} />
      </DetailsItem>
    </dl>
  );
};

export const ResourcePodCount: React.SFC<ResourcePodCountProps> = ({ resource }) => (
  <dl>
    <DetailsItem label="Current Count" obj={resource} path="status.replicas" defaultValue="0" />
    <DetailsItem label="Desired Count" obj={resource} path="spec.replicas" defaultValue="0" />
  </dl>
);

export type ResourceSummaryProps = {
  resource: K8sResourceKind;
  showPodSelector?: boolean;
  showNodeSelector?: boolean;
  showAnnotations?: boolean;
  showTolerations?: boolean;
  podSelector?: string;
  children?: React.ReactNode;
  customPathName?: string;
};

export type ResourcePodCountProps = {
  resource: K8sResourceKind;
};

ResourceSummary.displayName = 'ResourceSummary';
ResourcePodCount.displayName = 'ResourcePodCount';
