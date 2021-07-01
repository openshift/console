import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { observer } from '@patternfly/react-topology';
import { asAccessReview, useAccessReview } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s/types';
import { VMDetailsList, VMResourceSummary } from '../components/vms/vm-resource';
import { VirtualMachineModel } from '../models';
import { getKubevirtAvailableModel } from '../models/kubevirtReferenceForModel';
import { VMKind } from '../types/vm';
import { usePodsForVm } from '../utils/usePodsForVm';
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
