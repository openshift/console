import * as React from 'react';
import { Button, ButtonVariant, Checkbox, Text, TextVariants } from '@patternfly/react-core';
import { ModalTitle, ModalBody, ModalComponentProps } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import {
  withHandlePromise,
  HandlePromiseProps,
  FirehoseResult,
  Label,
} from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getVMLikeModel, isDedicatedCPUPlacement, asVM } from '../../../../selectors/vm';
import { getDedicatedCpuPatch } from '../../../../k8s/patches/vm/vm-cpu-patches';
import { getLoadedData, isLoaded, getLoadError } from '../../../../utils';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';
import { useNodeQualifier } from '../shared/hooks';
import { ModalFooter } from '../../modal/modal-footer';
import { NodeChecker } from '../shared/NodeChecker/node-checker';
import { DEDICATED_RESOURCES_MODAL_TITLE, DEDICATED_RESOURCES_LABELS } from '../shared/consts';
import './dedicated-resources-modal.scss';

export const DedicatedResourcesModal = withHandlePromise<DedicatedResourcesModalProps>(
  ({
    vmLikeEntity,
    vmLikeEntityLoading,
    nodes,
    close,
    handlePromise,
    inProgress,
    errorMessage,
  }) => {
    const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity);
    const loadError = getLoadError(nodes, NodeModel);
    const isCurrentCPUPinned = isDedicatedCPUPlacement(asVM(vmLikeFinal));

    const qualifiedNodes = useNodeQualifier(DEDICATED_RESOURCES_LABELS, nodes);

    const [showCollisionAlert, reload] = useCollisionChecker<VMLikeEntityKind>(
      vmLikeFinal,
      (oldVM: VMLikeEntityKind, newVM: VMLikeEntityKind) =>
        isDedicatedCPUPlacement(asVM(oldVM)) === isDedicatedCPUPlacement(asVM(newVM)),
    );

    const [isPinned, setIsPinned] = React.useState<boolean>(isCurrentCPUPinned);

    const onReload = () => {
      reload();
      setIsPinned(isCurrentCPUPinned);
    };

    const onSubmit = async () => {
      if (isPinned !== isCurrentCPUPinned) {
        // eslint-disable-next-line promise/catch-or-return
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getDedicatedCpuPatch(vmLikeFinal, isPinned),
          ),
        ).then(close);
      } else {
        close();
      }
    };

    return (
      <div className="modal-content">
        <ModalTitle>{DEDICATED_RESOURCES_MODAL_TITLE}</ModalTitle>
        <ModalBody>
          <Checkbox
            className="kubevirt-dedicated-resources__checkbox"
            label="Schedule this workload with dedicated resources (guaranteed policy)"
            isChecked={isPinned}
            isDisabled={!isLoaded(nodes) || inProgress}
            onChange={(flag) => setIsPinned(flag)}
            id="dedicated-resources-checkbox"
          />
          <Text
            className="kubevirt-dedicated-resources__helper-text"
            component={TextVariants.small}
          >
            Available only on Nodes with labels{' '}
            <Label kind={NodeModel.kind} name="cpumanager" value="true" expand />
          </Text>
          <NodeChecker qualifiedNodes={qualifiedNodes} />
        </ModalBody>
        <ModalFooter
          id="dedicated-resources"
          className="kubevirt-dedicated-resources__footer"
          errorMessage={errorMessage}
          inProgress={!isLoaded(nodes) || inProgress}
          isSimpleError={!!loadError}
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText="Apply"
          infoTitle={showCollisionAlert && 'Policy has been updated outside this flow.'}
          infoMessage={
            <>
              Saving these changes will override any policy previously saved.
              <br />
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                Reload Policy
              </Button>
              .
            </>
          }
        />
      </div>
    );
  },
);

type DedicatedResourcesModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    nodes?: FirehoseResult<VMLikeEntityKind[]>;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  };
