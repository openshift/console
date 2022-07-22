import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TableData } from '@console/internal/components/factory';
import { ResourceKebab, ResourceLink, Timestamp, Kebab } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';

const ProjectHelmChartRepositoryRow = ({ obj }) => {
  const { t } = useTranslation();
  const objReference = referenceFor(obj);
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(
      obj.metadata?.namespace ? ProjectHelmChartRepositoryModel : HelmChartRepositoryModel,
    ),
    ...Kebab.factory.common,
  ];

  return (
    <>
      <TableData>
        <ResourceLink
          kind={objReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData>
        {obj.kind === ProjectHelmChartRepositoryModel.kind ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('helm-plugin~All namespaces')
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

export default ProjectHelmChartRepositoryRow;
