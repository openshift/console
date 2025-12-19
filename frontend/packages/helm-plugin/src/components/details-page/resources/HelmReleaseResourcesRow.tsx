import type { FC } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { getNameCellProps } from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { ResourceLink, resourcePath } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { Status, DASH } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { tableColumnInfo } from './HelmReleaseResourcesHeader';

type HelmReleaseResourceStatusProps = {
  resource: K8sResourceKind;
};

export const HelmReleaseResourceStatus: FC<HelmReleaseResourceStatusProps> = ({
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

export const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) => {
  return data.map(({ obj: resource }) => {
    const kind = referenceFor(resource);
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={kind}
            name={resource.metadata.name}
            namespace={resource.metadata.namespace}
          />
        ),
        props: getNameCellProps(resource.metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: resource.kind,
      },
      [tableColumnInfo[2].id]: {
        cell: <HelmReleaseResourceStatus resource={resource} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={resource.metadata.creationTimestamp} />,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

export default getDataViewRows;
