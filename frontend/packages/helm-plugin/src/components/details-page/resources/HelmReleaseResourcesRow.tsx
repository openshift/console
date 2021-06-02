import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TableData, TableRow, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, resourcePath } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { tableColumnClasses } from './HelmReleaseResourcesHeader';

type HelmReleaseResourceStatusProps = {
  resource: K8sResourceKind;
};

export const HelmReleaseResourceStatus: React.FC<HelmReleaseResourceStatusProps> = ({
  resource,
}) => {
  const { t } = useTranslation();
  const kind = referenceFor(resource);
  return resource.status?.replicas ? (
    <Link
      to={`${resourcePath(kind, resource.metadata.name, resource.metadata.namespace)}/pods`}
      title={t('helm-plugin~Pods')}
    >
      {resource.status.replicas || 0} of {resource.spec.replicas} pods
    </Link>
  ) : (
    <Status status={_.get(resource.status, 'phase', 'Created')} />
  );
};

const HelmReleaseResourcesRow: RowFunction<K8sResourceKind> = ({
  obj: resource,
  index,
  key,
  style,
}) => {
  const kind = referenceFor(resource);
  return (
    <TableRow id={resource.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.name}>
        <ResourceLink
          kind={kind}
          name={resource.metadata.name}
          namespace={resource.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses.type}>{resource.kind}</TableData>
      <TableData className={tableColumnClasses.status}>
        <HelmReleaseResourceStatus resource={resource} />
      </TableData>
      <TableData className={tableColumnClasses.created}>
        <Timestamp timestamp={resource.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};

export default HelmReleaseResourcesRow;
