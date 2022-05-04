import * as React from 'react';
import { TableData } from '@console/internal/components/factory';
import { ResourceKebab, ResourceLink, Timestamp, Kebab } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ProjectHelmChartRepositoryModel } from '../../models';

const revisionReference = referenceForModel(ProjectHelmChartRepositoryModel);

const ProjectHelmChartRepositoryRow = ({ obj }) => {
  const objReference = referenceFor(obj);
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(ProjectHelmChartRepositoryModel),
    ...Kebab.factory.common,
  ];
  return (
    <>
      <TableData>
        <ResourceLink
          kind={revisionReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
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
