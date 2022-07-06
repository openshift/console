import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { ResourceKebab, ResourceLink, Timestamp, Kebab } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel } from '../../models';

const revisionReference = referenceForModel(HelmChartRepositoryModel);

const HelmChartRepositoryRow: React.FC<RowFunctionArgs> = ({ obj }) => {
  const { t } = useTranslation();
  const objReference = referenceFor(obj);
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(HelmChartRepositoryModel),
    ...Kebab.factory.common,
  ];
  return (
    <>
      <TableData>
        <ResourceLink
          kind={revisionReference}
          name={obj.metadata.name}
          namespace={obj.metadata?.namespace}
        />
      </TableData>
      <TableData>{obj.spec?.name ? obj.spec.name : '-'}</TableData>
      <TableData>{t('helm-plugin~All Namespaces')}</TableData>
      <TableData>{obj.spec?.disabled ? t('helm-plugin~True') : t('helm-plugin~False')}</TableData>
      <TableData>
        {obj.spec?.connectionConfig?.url ? (
          <a href={obj.spec.connectionConfig.url} target="_blank" rel="noopener noreferrer">
            {obj.spec.connectionConfig.url}
          </a>
        ) : (
          '-'
        )}
      </TableData>
      <TableData>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={Kebab.columnClass}>
        <ResourceKebab actions={menuActions} kind={objReference} resource={obj} />
      </TableData>
    </>
  );
};

export default HelmChartRepositoryRow;
