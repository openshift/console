import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getNameCellProps } from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { LazyActionMenu } from '@console/dynamic-plugin-sdk/src/lib-internal';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { DASH } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { ProjectHelmChartRepositoryModel } from '../../models';
import { tableColumnInfo } from './RepositoriesHeader';

const ProjectNamespaceCell: FC<{ kind: string; namespace: string }> = ({ kind, namespace }) => {
  const { t } = useTranslation();
  return kind === ProjectHelmChartRepositoryModel.kind ? (
    <ResourceLink kind="Namespace" name={namespace} />
  ) : (
    <>{t('helm-plugin~All Namespaces')}</>
  );
};

const DisabledCell: FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { t } = useTranslation();
  return <>{disabled ? t('helm-plugin~True') : t('helm-plugin~False')}</>;
};

export const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const objReference = referenceFor(obj);
    const context = { [objReference]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={objReference}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
        props: getNameCellProps(obj.metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: obj.spec?.name ?? DASH,
      },
      [tableColumnInfo[2].id]: {
        cell: <ProjectNamespaceCell kind={obj.kind} namespace={obj.metadata.namespace} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <DisabledCell disabled={obj.spec?.disabled} />,
      },
      [tableColumnInfo[4].id]: {
        cell: obj.spec?.connectionConfig?.url ? (
          <ExternalLink
            href={obj.spec.connectionConfig.url}
            text={obj.spec.connectionConfig.url}
            displayBlock
          />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
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
