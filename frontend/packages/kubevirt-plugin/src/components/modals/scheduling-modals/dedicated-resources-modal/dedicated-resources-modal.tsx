import * as React from 'react';
import { Button, ButtonVariant, Checkbox, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import {
  FirehoseResult,
  HandlePromiseProps,
  Label,
  withHandlePromise,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { k8sPatch, NodeKind } from '@console/internal/module/k8s';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';
import { getDedicatedCpuPatch } from '../../../../k8s/patches/vm/vm-cpu-patches';
import { asVM, getVMLikeModel, isDedicatedCPUPlacement } from '../../../../selectors/vm';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getLoadedData, getLoadError, isLoaded } from '../../../../utils';
import { ModalFooter } from '../../modal/modal-footer';
import { DEDICATED_RESOURCES_LABELS } from '../shared/consts';
import { useNodeQualifier } from '../shared/hooks';
import { NodeChecker } from '../shared/NodeChecker/node-checker';

import '../shared/scheduling-modals.scss';

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
    const { t } = useTranslation();
    const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity);
    const loadError = getLoadError(nodes, NodeModel);
    const isCurrentCPUPinned = isDedicatedCPUPlacement(asVM(vmLikeFinal));

    const qualifiedNodes = useNodeQualifier(nodes, 'label', DEDICATED_RESOURCES_LABELS);

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
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getDedicatedCpuPatch(vmLikeFinal, isPinned),
          ),
          close,
        );
      } else {
        close();
      }
    };

    return (
      <div className="modal-content">
        <ModalTitle>{t('kubevirt-plugin~Dedicated Resources')}</ModalTitle>
        <ModalBody>
          <Checkbox
            className="kubevirt-scheduling__checkbox"
            label={t(
              'kubevirt-plugin~Schedule this workload with dedicated resources (guaranteed policy)',
            )}
            isChecked={isPinned}
            isDisabled={!isLoaded(nodes) || inProgress}
            onChange={(flag) => setIsPinned(flag)}
            id="dedicated-resources-checkbox"
          />
          <Text className="kubevirt-scheduling__helper-text" component={TextVariants.small}>
            {t('kubevirt-plugin~Available only on Nodes with labels')}
          </Text>
          <Label kind={NodeModel.kind} name="cpumanager" value="true" expand />
          <NodeChecker qualifiedNodes={qualifiedNodes} />
        </ModalBody>
        <ModalFooter
          id="dedicated-resources"
          errorMessage={errorMessage}
          inProgress={!isLoaded(nodes) || inProgress}
          isSimpleError={!!loadError}
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText={t('kubevirt-plugin~Save')}
          infoTitle={
            showCollisionAlert && t('kubevirt-plugin~Policy has been updated outside this flow.')
          }
          infoMessage={
            <>
              {t('kubevirt-plugin~Saving these changes will override any policy previously saved.')}
              <br />
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                {t('kubevirt-plugin~Reload Policy')}
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
    nodes?: FirehoseResult<NodeKind[]>;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  };
