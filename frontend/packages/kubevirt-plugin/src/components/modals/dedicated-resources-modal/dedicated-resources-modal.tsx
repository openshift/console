import * as React from 'react';
import { Checkbox, Modal, Text, TextVariants } from '@patternfly/react-core';
import { k8sPatch } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { getLabel } from '@console/shared';
import {
  Firehose,
  withHandlePromise,
  HandlePromiseProps,
  FirehoseResult,
  Label,
} from '@console/internal/components/utils';
import { ModalFooter } from '../modal/modal-footer';
import { getVMLikeModel, isDedicatedCPUPlacement, asVM } from '../../../selectors/vm';
import { getDedicatedCpuPatch } from '../../../k8s/patches/vm/vm-cpu-patches';
import { VMLikeEntityKind } from '../../../types';
import { getLoadedData, isLoaded, getLoadError } from '../../../utils';
import { RESOURCE_NO_NODES_AVAILABLE, DEDICATED_RESOURCES } from './consts';
import './dedicated-resources-modal.scss';

const ResourceModal = withHandlePromise<ResourceModalProps>(
  ({ vmLikeEntity, nodes, isOpen, setOpen, handlePromise, inProgress, errorMessage }) => {
    const isLoading = !isLoaded(nodes);
    const loadError = getLoadError(nodes, NodeModel);
    const isCPUPinned = isDedicatedCPUPlacement(asVM(vmLikeEntity));
    const loadedNodes = getLoadedData(nodes, []);

    const [isPinned, setIsPinned] = React.useState<boolean>(isCPUPinned);
    const [showPatchError, setPatchError] = React.useState<boolean>(false);
    const isNodeAvailable = loadedNodes.some((node) => getLabel(node, 'cpumanager') === 'true');

    const submit = async () => {
      if (isPinned !== isCPUPinned) {
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeEntity),
            vmLikeEntity,
            await getDedicatedCpuPatch(vmLikeEntity, isPinned),
          ),
        )
          .then(() => setOpen(false))
          .catch(() => setPatchError(true));
      } else {
        setOpen(false);
      }
    };
    const footer = (
      <ModalFooter
        className=""
        warningMessage={!loadError && !isNodeAvailable && RESOURCE_NO_NODES_AVAILABLE}
        errorMessage={showPatchError && errorMessage}
        inProgress={inProgress || isLoading}
        isSimpleError={!isNodeAvailable}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
        submitButtonText="Save"
      />
    );

    return (
      <Modal
        width="50%"
        title={DEDICATED_RESOURCES}
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        footer={footer}
        isFooterLeftAligned
      >
        <Checkbox
          className="kubevirt-cpu-pinning__checkbox"
          label="Schedule this workload with dedicated resources (guaranteed policy)"
          isChecked={isPinned}
          isDisabled={isLoading}
          onChange={setIsPinned}
          id="cpu-pinning-checkbox"
        />
        <Text className="kubevirt-cpu-pinning__helper-text" component={TextVariants.small}>
          Available only on Nodes with labels{' '}
          <Label kind={NodeModel.kind} name="cpumanager" value="true" expand />
        </Text>
      </Modal>
    );
  },
);

type ResourceModalProps = HandlePromiseProps & {
  vmLikeEntity: VMLikeEntityKind;
  isOpen: boolean;
  nodes?: FirehoseResult<VMLikeEntityKind[]>;
  setOpen: (isOpen: boolean) => void;
};

export const DedicatedResourcesModal: React.FC<DedicatedResourcesModalProps> = (props) => {
  const { vmLikeEntity, ...restProps } = props;

  const resources = [
    {
      kind: NodeModel.kind,
      isList: true,
      namespaced: false,
      prop: 'nodes',
    },
  ];

  return (
    <Firehose resources={resources}>
      <ResourceModal vmLikeEntity={vmLikeEntity} {...restProps} />
    </Firehose>
  );
};

type DedicatedResourcesModalProps = {
  vmLikeEntity: VMLikeEntityKind;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};
