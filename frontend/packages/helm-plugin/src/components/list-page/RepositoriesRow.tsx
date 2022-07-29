import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import {
  ResourceKebab,
  ResourceLink,
  Timestamp,
  Kebab,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';

const helmChartRepositoryReference = referenceForModel(HelmChartRepositoryModel);
const projectHelmChartRepositoryReference = referenceForModel(ProjectHelmChartRepositoryModel);

const RepositoriesRow: React.FC<RowFunctionArgs> = ({ obj }) => {
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
          kind={
            obj.kind === HelmChartRepositoryModel.kind
              ? helmChartRepositoryReference
              : projectHelmChartRepositoryReference
          }
          name={obj.metadata.name}
          namespace={obj.metadata?.namespace}
        />
      </TableData>
      <TableData>{obj.spec?.name ? obj.spec.name : '-'}</TableData>
      <TableData>
        {obj.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('helm-plugin~All Namespaces')
        )}
      </TableData>
      <TableData>{obj.spec?.disabled ? t('helm-plugin~True') : t('helm-plugin~False')}</TableData>
      <TableData>
        {obj.spec?.connectionConfig?.url ? (
          <ExternalLink href={obj.spec.connectionConfig.url} text={obj.spec.connectionConfig.url} />
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

export default RepositoriesRow;
