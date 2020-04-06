import * as React from 'react';
import {
  Firehose,
  FirehoseResult,
  LoadingBox,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { Node } from '@console/topology';
import { TemplateKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../models';
import { TemplateModel } from '@console/internal/models';
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
    <div className="row">
      <div className="col-sm-6">
        <VMResourceSummary
          canUpdateVM={canUpdate}
          vm={vmObj}
          vmi={vmi}
          templates={templates.data}
          kindObj={VirtualMachineModel}
        />
      </div>
      <div className="col-sm-6">
        <VMDetailsList
          canUpdateVM={canUpdate}
          vm={vmObj}
          vmi={vmi}
          pods={pods}
          kindObj={VirtualMachineModel}
          vmStatusBundle={statusDetail}
        />
      </div>
    </div>
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
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <LoadedTopologyVmDetailsPanel vm={vm} />
      </Firehose>
    </div>
  );
};
