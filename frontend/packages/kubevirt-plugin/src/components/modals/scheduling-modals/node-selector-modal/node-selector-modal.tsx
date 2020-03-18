import * as React from 'react';
import * as _ from 'lodash';
import { ModalTitle, ModalBody, ModalComponentProps } from '@console/internal/components/factory';
import { Button, ButtonVariant } from '@patternfly/react-core';
import {
  FirehoseResult,
  withHandlePromise,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { isLoaded, getLoadedData, getLoadError } from '../../../../utils';
import { ModalFooter } from '../../modal/modal-footer';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getVMLikeModel, getNodeSelector } from '../../../../selectors/vm';
import { getNodeSelectorPatches } from '../../../../k8s/patches/vm/vm-scheduling-patches';
import { NodeChecker } from '../shared/NodeChecker/node-checker';
import { useNodeQualifier } from '../shared/hooks';
import { LabelsList } from '../../../LabelsList/labels-list';
import { NODE_SELECTOR_MODAL_TITLE } from '../shared/consts';
import { nodeSelectorToIDLabels } from './helpers';
import { useIDEntities } from '../../../../hooks/use-id-entities';
import { IDLabel } from '../../../LabelsList/types';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';

export const NSModal = withHandlePromise(
  ({
    nodes,
    close,
    handlePromise,
    inProgress,
    errorMessage,
    vmLikeEntity,
    vmLikeEntityLoading,
  }: NSModalProps) => {
    const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity);
    const loadError = getLoadError(nodes, NodeModel);

    const [
      selectorLabels,
      setSelectorLabels,
      onLabelAdd,
      onLabelChange,
      onLabelDelete,
    ] = useIDEntities<IDLabel>(nodeSelectorToIDLabels(getNodeSelector(vmLikeEntity)));

    const qualifiedNodes = useNodeQualifier(selectorLabels, nodes);

    const [showCollisionAlert, reload] = useCollisionChecker<VMLikeEntityKind>(
      vmLikeFinal,
      (oldVM: VMLikeEntityKind, newVM: VMLikeEntityKind) =>
        _.isEqual(getNodeSelector(oldVM), getNodeSelector(newVM)),
    );

    const onSelectorLabelAdd = () => onLabelAdd({ id: null, key: '', value: '' } as IDLabel);

    const onReload = () => {
      reload();
      setSelectorLabels(nodeSelectorToIDLabels(getNodeSelector(vmLikeFinal)));
    };

    const onSubmit = async () => {
      const k8sSelector = selectorLabels.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {});

      if (!_.isEqual(getNodeSelector(vmLikeFinal), k8sSelector)) {
        // eslint-disable-next-line promise/catch-or-return
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getNodeSelectorPatches(vmLikeFinal, k8sSelector),
          ),
        ).then(close);
      } else {
        close();
      }
    };

    return (
      <div className="modal-content">
        <ModalTitle>{NODE_SELECTOR_MODAL_TITLE}</ModalTitle>
        <ModalBody>
          <LabelsList
            kind="Node"
            labels={selectorLabels}
            onLabelAdd={onSelectorLabelAdd}
            onLabelChange={onLabelChange}
            onLabelDelete={onLabelDelete}
            emptyStateAddRowText="Add Label to specify qualifying nodes"
          />
          <NodeChecker qualifiedNodes={qualifiedNodes} />
        </ModalBody>
        <ModalFooter
          id="node-selector"
          errorMessage={errorMessage}
          inProgress={!isLoaded(nodes) || inProgress}
          isSimpleError={!!loadError}
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText="Apply"
          infoTitle={showCollisionAlert && 'Node Selector has been updated outside this flow.'}
          infoMessage={
            <>
              Saving these changes will override any Node Selector previously saved.
              <br />
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                Reload Node Selector
              </Button>
              .
            </>
          }
        />
      </div>
    );
  },
);

type NSModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    nodes?: FirehoseResult<VMLikeEntityKind[]>;
    inProgress: boolean;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
    errorMessage: string;
  };
