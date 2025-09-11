import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink, resourcePath } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { K8sResourceWithMetadata } from '../../../types/helm-types';
import { tableColumnClasses } from './HelmReleaseResourcesHeader';

const hasRequiredMetadata = (resource: K8sResourceKind): resource is K8sResourceWithMetadata => {
  return !!(resource.metadata?.name && resource.kind);
};

type HelmReleaseResourceStatusProps = {
  resource: K8sResourceKind;
};

export const HelmReleaseResourceStatus: React.FC<HelmReleaseResourceStatusProps> = ({
  resource,
}) => {
  const { t } = useTranslation();
  const kind = referenceFor(resource);

  if (!hasRequiredMetadata(resource)) {
    return <Status status="Unknown" />;
  }

  const resourceName = resource.metadata.name;
  const resourceNamespace = resource.metadata.namespace;

  if (!resourceNamespace) {
    return <Status status="Unknown" />;
  }

  return resource.status?.replicas ? (
    <Link
      to={`${resourcePath(kind, resourceName, resourceNamespace)}/pods`}
      title={t('helm-plugin~Pods')}
    >
      {resource.status?.replicas || 0} of {resource.spec?.replicas} pods
    </Link>
  ) : (
    <Status status={_.get(resource.status, 'phase', 'Created')} />
  );
};

const HelmReleaseResourcesRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj: resource }) => {
  const kind = referenceFor(resource);

  if (!hasRequiredMetadata(resource)) {
    return (
      <>
        <TableData className={tableColumnClasses.name}>Unknown Resource</TableData>
        <TableData className={tableColumnClasses.type}>{resource.kind || 'Unknown'}</TableData>
        <TableData className={tableColumnClasses.status}>
          <Status status="Unknown" />
        </TableData>
        <TableData className={tableColumnClasses.created}>
          <Timestamp timestamp={resource.metadata?.creationTimestamp} />
        </TableData>
      </>
    );
  }

  const resourceName = resource.metadata.name;
  const resourceNamespace = resource.metadata.namespace;
  const resourceKind = resource.kind;

  return (
    <>
      <TableData className={tableColumnClasses.name}>
        <ResourceLink kind={kind} name={resourceName} namespace={resourceNamespace} />
      </TableData>
      <TableData className={tableColumnClasses.type}>{resourceKind}</TableData>
      <TableData className={tableColumnClasses.status}>
        <HelmReleaseResourceStatus resource={resource} />
      </TableData>
      <TableData className={tableColumnClasses.created}>
        <Timestamp timestamp={resource.metadata.creationTimestamp} />
      </TableData>
    </>
  );
};

export default HelmReleaseResourcesRow;
