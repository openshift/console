import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResult,
  LoadingBox,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { Node } from '@console/topology';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VirtualMachineModel } from '../models';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../constants/vm';
import { VMDetailsList, VMResourceSummary } from '../components/vms/vm-resource';

type TopologyVmDetailsPanelProps = {
  vm: Node;
};

type LoadedTopologyVmDetailsPanelProps = TopologyVmDetailsPanelProps & {
  loaded?: boolean;
  templates?: FirehoseResult<TemplateKind[]>;
};

export const LoadedTopologyVmDetailsPanel: React.FC<LoadedTopologyVmDetailsPanelProps> = ({
  loaded,
  vm,
  templates,
}) => {
  const vmData = vm.getData();
  const { pods, obj: vmObj } = vmData.resources;
  const { vmi, statusDetail } = vmData.data;
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
          vmStatusBundle={statusDetail}
        />
      </GridItem>
    </Grid>
  );
};

export const TopologyVmDetailsPanel: React.FC<TopologyVmDetailsPanelProps> = ({
  vm,
}: TopologyVmDetailsPanelProps) => {
  const vmData = vm.getData();
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
        <LoadedTopologyVmDetailsPanel vm={vm} />
      </Firehose>
    </div>
  );
};
