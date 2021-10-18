import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RowProps } from '@console/dynamic-plugin-sdk';
import { TableData } from '@console/internal/components/factory/Table/VirtualizedTable';
import {
  Kebab,
  ResourceLink,
  Timestamp,
  ResourceKebab,
  Selector,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PodDisruptionBudgetModel } from '../../models';
import { tableColumnInfo } from './pdb-table-columns';
import { PodDisruptionBudgetKind } from './types';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(PodDisruptionBudgetModel), ...common];

const PodDisruptionBudgetTableRow: React.FC<RowProps<PodDisruptionBudgetKind>> = ({
  obj,
  activeColumnIDs,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <TableData {...tableColumnInfo[0]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          kind={referenceForModel(PodDisruptionBudgetModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData {...tableColumnInfo[1]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData {...tableColumnInfo[2]} activeColumnIDs={activeColumnIDs}>
        <Selector selector={obj.spec.selector} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData {...tableColumnInfo[3]} activeColumnIDs={activeColumnIDs}>
        {_.isNil(obj.spec.maxUnavailable) && _.isNil(obj.spec.minAvailable)
          ? '-'
          : _.isNil(obj.spec.maxUnavailable)
          ? `${t('console-app~Min available')} ${obj.spec.minAvailable}`
          : `${t('console-app~Max unavailable')} ${obj.spec.maxUnavailable}`}
      </TableData>
      <TableData {...tableColumnInfo[4]} activeColumnIDs={activeColumnIDs}>
        {obj.status.disruptionsAllowed}
      </TableData>
      <TableData {...tableColumnInfo[5]} activeColumnIDs={activeColumnIDs}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData {...tableColumnInfo[6]} activeColumnIDs={activeColumnIDs}>
        <ResourceKebab actions={menuActions} kind={obj.kind} resource={obj} />
      </TableData>
    </>
  );
};

export default PodDisruptionBudgetTableRow;
