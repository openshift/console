import * as React from 'react';
import { Radio } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { NodeKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src/selectors/common';
import { NodesTable } from '../tables/nodes-table';

import './body.scss';

export const LocalVolumeDiscoveryBody: React.FC<LocalVolumeDiscoveryBodyProps> = ({
  allNodes,
  selectNodes,
  showSelectNodes,
  setSelectNodes,
  setShowSelectNodes,
  taintsFilter,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div id="auto-detect-volume-radio-group-node-selector">
        <Radio
          label={
            <>
              {t('lso-plugin~Disks on all nodes')} {'('}
              {t('lso-plugin~{{nodes, number}} node', {
                nodes: allNodes.length,
                count: allNodes.length,
              })}
              {')'}
            </>
          }
          name="nodes-selection"
          id="auto-detect-volume-radio-all-nodes"
          className="lso-lvd-body__all-nodes-radio--padding"
          value="allNodes"
          onChange={setShowSelectNodes}
          description={t('lso-plugin~Discovers available disks on all nodes.')}
          checked={!showSelectNodes}
        />
        <Radio
          label={t('lso-plugin~Disks on selected nodes')}
          name="nodes-selection"
          id="auto-detect-volume-radio-select-nodes"
          value="selectedNodes"
          onChange={setShowSelectNodes}
          description={t(
            'lso-plugin~Allows you to limit the discovery for available disks to specific nodes.',
          )}
          checked={showSelectNodes}
        />
      </div>
      {showSelectNodes && (
        <div className="lso-lvd-body__select-nodes">
          <ListPage
            showTitle={false}
            kind={NodeModel.kind}
            ListComponent={NodesTable}
            customData={{
              onRowSelected: (selectedNodes: NodeKind[]) => setSelectNodes(selectedNodes),
              preSelectedNodes: selectNodes.map(getName),
              hasOnSelect: true,
              taintsFilter,
            }}
          />
        </div>
      )}
    </>
  );
};

type LocalVolumeDiscoveryBodyProps = {
  allNodes: NodeKind[];
  selectNodes: NodeKind[];
  showSelectNodes: boolean;
  setSelectNodes: (nodes: NodeKind[]) => void;
  setShowSelectNodes: (boolean) => void;
  taintsFilter?: (node: NodeKind) => boolean;
};
