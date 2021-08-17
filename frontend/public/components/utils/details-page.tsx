import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash-es';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';

import { DetailsItem } from './details-item';
import { Kebab } from './kebab';
import { LabelList } from './label-list';
import { OwnerReferences } from './owner-references';
import { ResourceLink } from './resource-link';
import { Selector } from './selector';
import { Timestamp } from './timestamp';
import { useAccessReview } from './rbac';
import {
  K8sResourceCommon,
  K8sResourceKind,
  modelFor,
  referenceFor,
  Toleration,
} from '../../module/k8s';
import { labelsModal } from '../modals';

const editLabelsModal = (e, props) => {
  e.preventDefault();
  labelsModal(props);
};

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

export const ResourceSummary: React.FC<ResourceSummaryProps> = ({
  children,
  resource,
  customPathName,
  showPodSelector = false,
  showNodeSelector = false,
  showAnnotations = true,
  showTolerations = false,
  showLabelEditor = true,
  canUpdateResource = true,
  podSelector = 'spec.selector',
  nodeSelector = 'spec.template.spec.nodeSelector',
}) => {
  const { t } = useTranslation();
  const { metadata } = resource;
  const reference = referenceFor(resource);
  const model = modelFor(reference);
  const tolerationsPath = getTolerationsPath(resource);
  const tolerations: Toleration[] = _.get(resource, tolerationsPath);
  const [canUpdateAccess] = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'patch',
    name: metadata.name,
    namespace: metadata.namespace,
  });
  const canUpdate = canUpdateAccess && canUpdateResource;

  return (
    <dl data-test-id="resource-summary" className="co-m-pane__details">
      <DetailsItem
        label={t('public~Name')}
        obj={resource}
        path={customPathName || 'metadata.name'}
      />
      {metadata.namespace && (
        <DetailsItem label={t('public~Namespace')} obj={resource} path="metadata.namespace">
          <ResourceLink
            kind="Namespace"
            name={metadata.namespace}
            title={metadata.uid}
            namespace={null}
          />
        </DetailsItem>
      )}
      <DetailsItem
        label={t('public~Labels')}
        obj={resource}
        path="metadata.labels"
        valueClassName="details-item__value--labels"
        onEdit={(e) => editLabelsModal(e, { resource, kind: model })}
        canEdit={showLabelEditor && canUpdate}
        editAsGroup
      >
        <LabelList kind={reference} labels={metadata.labels} />
      </DetailsItem>
      {showPodSelector && (
        <DetailsItem label={t('public~Pod selector')} obj={resource} path={podSelector}>
          <Selector
            selector={_.get(resource, podSelector)}
            namespace={_.get(resource, 'metadata.namespace')}
          />
        </DetailsItem>
      )}
      {showNodeSelector && (
        <DetailsItem label={t('public~Node selector')} obj={resource} path={nodeSelector}>
          <Selector kind={t('public~Node')} selector={_.get(resource, nodeSelector)} />
        </DetailsItem>
      )}
      {showTolerations && (
        <DetailsItem label={t('public~Tolerations')} obj={resource} path={tolerationsPath}>
          {canUpdate ? (
            <Button
              type="button"
              isInline
              onClick={Kebab.factory.ModifyTolerations(model, resource).callback}
              variant="link"
            >
              {t('public~{{count}} toleration', { count: _.size(tolerations) })}
              <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
            </Button>
          ) : (
            t('public~{{count}} toleration', { count: _.size(tolerations) })
          )}
        </DetailsItem>
      )}
      {showAnnotations && (
        <DetailsItem label={t('public~Annotations')} obj={resource} path="metadata.annotations">
          {canUpdate ? (
            <Button
              data-test="edit-annotations"
              type="button"
              isInline
              onClick={Kebab.factory.ModifyAnnotations(model, resource).callback}
              variant="link"
            >
              {t('public~{{count}} annotation', { count: _.size(metadata.annotations) })}
              <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
            </Button>
          ) : (
            t('public~{{count}} annotation', { count: _.size(metadata.annotations) })
          )}
        </DetailsItem>
      )}
      {children}
      <DetailsItem label={t('public~Created at')} obj={resource} path="metadata.creationTimestamp">
        <Timestamp timestamp={metadata.creationTimestamp} />
      </DetailsItem>
      <DetailsItem label={t('public~Owner')} obj={resource} path="metadata.ownerReferences">
        <OwnerReferences resource={resource} />
      </DetailsItem>
    </dl>
  );
};

export const ResourcePodCount: React.SFC<ResourcePodCountProps> = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <>
      <DetailsItem
        label={t('public~Current count')}
        obj={resource}
        path="status.replicas"
        defaultValue="0"
      />
      <DetailsItem
        label={t('public~Desired count')}
        obj={resource}
        path="spec.replicas"
        defaultValue="0"
      />
    </>
  );
};

export const RuntimeClass: React.FC<RuntimeClassProps> = ({ obj, path }) => {
  const { t } = useTranslation();
  return (
    <DetailsItem
      label={t('public~Runtime class')}
      obj={obj}
      path={path || 'spec.template.spec.runtimeClassName'}
      hideEmpty
    />
  );
};

export type ResourceSummaryProps = {
  resource: K8sResourceKind;
  showPodSelector?: boolean;
  showNodeSelector?: boolean;
  showAnnotations?: boolean;
  showTolerations?: boolean;
  showLabelEditor?: boolean;
  canUpdateResource?: boolean;
  podSelector?: string;
  nodeSelector?: string;
  children?: React.ReactNode;
  customPathName?: string;
};

export type ResourcePodCountProps = {
  resource: K8sResourceKind;
};

export type RuntimeClassProps = {
  obj: K8sResourceCommon;
  path?: string;
};

ResourceSummary.displayName = 'ResourceSummary';
ResourcePodCount.displayName = 'ResourcePodCount';
