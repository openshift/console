import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp, Kebab, ResourceKebab } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineResourceModel } from '../../../models';
import { PipelineResourceKind } from '../../../types';
import { pipelineResourceFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineResourceListFilterLabels } from '../../../utils/pipeline-utils';
import { tableColumnClasses } from './pipeline-resources-table';

const PipelineResourcesRow: RowFunction<PipelineResourceKind> = ({ obj, index, key, style }) => {
  const pipelineResourcesReference = referenceForModel(PipelineResourceModel);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelineResourcesReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
          data-test-id={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {PipelineResourceListFilterLabels[pipelineResourceFilterReducer(obj)]}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab
          actions={Kebab.factory.common}
          kind={pipelineResourcesReference}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

export default PipelineResourcesRow;
