import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { observer } from '@patternfly/react-topology';
import { asAccessReview, useAccessReview } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s/types';
import { VMDetailsList } from '../kubevirt-dependencies/components/vm/VMDetailsList';
import { VMResourceSummary } from '../kubevirt-dependencies/components/vm/VMResourceSummary';
import { usePodsForVm } from '../kubevirt-dependencies/hooks/usePodsForVM';
import { VirtualMachineModel } from '../kubevirt-dependencies/models';
import { getKubevirtAvailableModel } from '../kubevirt-dependencies/models/kubevirtReferenceForModel';
import { VMKind } from '../kubevirt-dependencies/types/vm';
import { VMNode } from './types';

type TopologyVmDetailsPanelProps = {
  vmNode: VMNode;
};

export const TopologyVmDetailsPanel: React.FC<TopologyVmDetailsPanelProps> = observer(
  ({ vmNode }) => {
    const vmData = vmNode.getData();
    const vmObj = vmData.resource as VMKind;
    const { podData: { pods = [] } = {} } = usePodsForVm(vmObj);
    const { vmi, vmStatusBundle } = vmData.data;
    const canUpdate =
      useAccessReview(
        asAccessReview(getKubevirtAvailableModel(VirtualMachineModel), vmObj || {}, 'patch'),
      ) && !!vmObj;
    return (
      <div className="overview__sidebar-pane-body resource-overview__body">
        <Grid hasGutter>
          <GridItem span={6}>
            <VMResourceSummary
              canUpdateVM={canUpdate}
              vm={vmObj}
              vmi={vmi}
              kindObj={VirtualMachineModel}
            />
          </GridItem>
          <GridItem span={6}>
            <VMDetailsList
              canUpdateVM={canUpdate}
              vm={vmObj}
              vmi={vmi}
              pods={pods as PodKind[]}
              kindObj={VirtualMachineModel}
              vmStatusBundle={vmStatusBundle}
            />
          </GridItem>
        </Grid>
      </div>
    );
  },
);
