import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NodeModel } from '@console/internal/models';
import { ListPage } from '@console/internal/components/factory/list-page';
import { NodeKind } from '@console/internal/module/k8s';
import { SelectNodesTableFooter } from './select-nodes-table-footer';
import InternalNodeTable from './node-list';
import { WizardNodeState } from '../reducer';
import './select-nodes-table.scss';

export const SelectNodesTable: React.FC<NodeSelectTableProps> = ({ nodes, onRowSelected }) => {
  const { t } = useTranslation();
  return (
    <div className="odf-capacity-and-nodes__select-nodes">
      <ListPage
        kind={NodeModel.kind}
        showTitle={false}
        ListComponent={InternalNodeTable}
        nameFilterPlaceholder={t('ceph-storage-plugin~Search by node name...')}
        labelFilterPlaceholder={t('ceph-storage-plugin~Search by node label...')}
        customData={{
          onRowSelected,
          nodes: new Set(nodes.map(({ uid }) => uid)),
        }}
      />
      {!!nodes.length && <SelectNodesTableFooter nodes={nodes} />}
    </div>
  );
};

type NodeSelectTableProps = {
  nodes: WizardNodeState[];
  onRowSelected: (selectedNodes: NodeKind[]) => void;
};
