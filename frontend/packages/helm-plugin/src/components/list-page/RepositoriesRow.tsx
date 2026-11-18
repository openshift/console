import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { DASH } from '@console/shared/src/constants/ui';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models/helm';
import { tableColumnInfo } from './RepositoriesHeader';

const helmChartRepositoryReference = referenceForModel(HelmChartRepositoryModel);
const projectHelmChartRepositoryReference = referenceForModel(ProjectHelmChartRepositoryModel);

const CombinedNamespaceCell: FC<{ namespace?: string }> = ({ namespace }) => {
  const { t } = useTranslation('helm-plugin');
  return namespace ? (
    <ResourceLink kind="Namespace" name={namespace} />
  ) : (
    <>{t('All Namespaces')}</>
  );
};

const DisabledCell: FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { t } = useTranslation('helm-plugin');
  return <>{disabled ? t('True') : t('False')}</>;
};

export const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) =>
  data.map(({ obj }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={
              obj.kind === HelmChartRepositoryModel.kind
                ? helmChartRepositoryReference
                : projectHelmChartRepositoryReference
            }
            name={obj.metadata.name}
            namespace={obj.metadata?.namespace}
          />
        ),
      },
      [tableColumnInfo[1].id]: {
        cell: obj.spec?.name ?? DASH,
      },
      [tableColumnInfo[2].id]: {
        cell: <CombinedNamespaceCell namespace={obj.metadata.namespace} />,
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
    };

    return columns.map(({ id }) => {
      if (id === tableColumnInfo[6].id) return { id };
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        cell,
      };
    });
  });
