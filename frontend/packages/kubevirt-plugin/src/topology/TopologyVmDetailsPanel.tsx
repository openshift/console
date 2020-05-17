import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResult,
  LoadingBox,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { observer } from '@console/topology';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VirtualMachineModel } from '../models';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../constants/vm';
import { VMDetailsList, VMResourceSummary } from '../components/vms/vm-resource';
import { VMNode } from './types';
import { VMKind } from '../types/vm';

type TopologyVmDetailsPanelProps = {
  vmNode: VMNode;
};

type LoadedTopologyVmDetailsPanelProps = TopologyVmDetailsPanelProps & {
  loaded?: boolean;
  templates?: FirehoseResult<TemplateKind[]>;
};

const LoadedTopologyVmDetailsPanel: React.FC<LoadedTopologyVmDetailsPanelProps> = observer(
  ({ loaded, vmNode, templates }) => {
    const vmData = vmNode.getData();
    const { pods, obj } = vmData.resources;
    const vmObj = obj as VMKind;
    const { vmi, vmStatusBundle } = vmData.data;
    const canUpdate =
      useAccessReview(asAccessReview(VirtualMachineModel, vmObj || {}, 'patch')) && !!vmObj;

    if (!loaded) {
      return <LoadingBox />;
    }
    return (
      <Grid gutter="md">
        <GridItem span={6}>
          <VMResourceSummary
            canUpdateVM={canUpdate}
            vm={vmObj}
            vmi={vmi}
            templates={templates.data}
            kindObj={VirtualMachineModel}
          />
        </GridItem>
        <GridItem span={6}>
          <VMDetailsList
            canUpdateVM={canUpdate}
            vm={vmObj}
            vmi={vmi}
            pods={pods}
            kindObj={VirtualMachineModel}
            vmStatusBundle={vmStatusBundle}
          />
        </GridItem>
      </Grid>
    );
  },
);

export const TopologyVmDetailsPanel: React.FC<TopologyVmDetailsPanelProps> = observer(
  ({ vmNode }: TopologyVmDetailsPanelProps) => {
    const vmData = vmNode.getData();
    const vmObj = vmData.resources.obj;
    const { namespace } = vmObj.metadata;

    const resources = [
      {
        kind: TemplateModel.kind,
        namespace,
        isList: true,
        prop: 'templates',
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
      },
    ];
    return (
      <div className="overview__sidebar-pane-body resource-overview__body">
        <Firehose resources={resources}>
          <LoadedTopologyVmDetailsPanel vmNode={vmNode} />
        </Firehose>
      </div>
    );
  },
);
