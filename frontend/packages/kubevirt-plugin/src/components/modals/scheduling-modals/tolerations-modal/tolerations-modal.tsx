import * as React from 'react';
import * as _ from 'lodash';
import { ModalTitle, ModalBody, ModalComponentProps } from '@console/internal/components/factory';
import { Button, ButtonVariant } from '@patternfly/react-core';
import {
  FirehoseResult,
  withHandlePromise,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import { k8sPatch, NodeKind } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { isLoaded, getLoadedData, getLoadError } from '../../../../utils';
import { ModalFooter } from '../../modal/modal-footer';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getVMLikeTolerations } from '../../../../selectors/vm-like/selectors';
import { getVMLikeModel } from '../../../../selectors/vm';
import { getTolerationsPatch } from '../../../../k8s/patches/vm/vm-scheduling-patches';
import { NodeChecker } from '../shared/NodeChecker/node-checker';
import { useNodeQualifier } from '../shared/hooks';
import { LabelsList } from '../../../LabelsList/labels-list';
import { TOLERATIONS_MODAL_TITLE, TOLERATIONS_EFFECTS } from '../shared/consts';
import { useIDEntities } from '../../../../hooks/use-id-entities';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';
import { TolerationRow } from './toleration-row';
import { TolerationHeader } from './toleration-header';
import { TolerationLabel } from './types';

export const TModal = withHandlePromise(
  ({
    nodes,
    close,
    handlePromise,
    inProgress,
    errorMessage,
    vmLikeEntity,
    vmLikeEntityLoading,
  }: TModalProps) => {
    const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity);
    const loadError = getLoadError(nodes, NodeModel);

    const [
      tolerationsLabels,
      setTolerationsLabels,
      onLabelAdd,
      onLabelChange,
      onLabelDelete,
    ] = useIDEntities<TolerationLabel>(
      getVMLikeTolerations(vmLikeEntity)?.map((toleration, id) => ({ ...toleration, id })),
    );

    const qualifiedNodes = useNodeQualifier(nodes, 'taint', tolerationsLabels);

    const [showCollisionAlert, reload] = useCollisionChecker<VMLikeEntityKind>(
      vmLikeFinal,
      (oldVM: VMLikeEntityKind, newVM: VMLikeEntityKind) =>
        _.isEqual(getVMLikeTolerations(oldVM), getVMLikeTolerations(newVM)),
    );

    const onTolerationAdd = () =>
      onLabelAdd({
        id: null,
        key: '',
        value: '',
        effect: TOLERATIONS_EFFECTS[0],
      } as TolerationLabel);

    const onReload = () => {
      reload();
      setTolerationsLabels(
        getVMLikeTolerations(vmLikeFinal)?.map((toleration, id) => ({
          ...toleration,
          id,
        })) || [],
      );
    };

    const onSubmit = async () => {
      const k8sTolerations = tolerationsLabels.filter(({ key }) => !!key);

      if (!_.isEqual(getVMLikeTolerations(vmLikeFinal), k8sTolerations)) {
        // eslint-disable-next-line promise/catch-or-return
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getTolerationsPatch(vmLikeFinal, k8sTolerations),
          ),
        ).then(close);
      } else {
        close();
      }
    };

    return (
      <div className="modal-content">
        <ModalTitle>{TOLERATIONS_MODAL_TITLE}</ModalTitle>
        <ModalBody>
          <LabelsList
            isEmpty={tolerationsLabels.length === 0}
            kind="Node"
            onLabelAdd={onTolerationAdd}
            addRowText="Add Toleration"
            emptyStateAddRowText="Add Toleration to specify qualifying nodes"
          >
            {tolerationsLabels.length > 0 && (
              <>
                <TolerationHeader key="label-title-row" />
                {tolerationsLabels.map((label) => (
                  <TolerationRow
                    key={label.id}
                    label={label}
                    onChange={onLabelChange}
                    onDelete={onLabelDelete}
                  />
                ))}
              </>
            )}
          </LabelsList>
          <NodeChecker qualifiedNodes={qualifiedNodes} />
        </ModalBody>
        <ModalFooter
          id="tolerations"
          errorMessage={errorMessage}
          inProgress={!isLoaded(nodes) || inProgress}
          isSimpleError={!!loadError}
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText="Apply"
          infoTitle={showCollisionAlert && 'Tolerations has been updated outside this flow.'}
          infoMessage={
            <>
              Saving these changes will override any Tolerations previously saved.
              <br />
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                Reload Tolerations
              </Button>
              .
            </>
          }
        />
      </div>
    );
  },
);

type TModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    nodes?: FirehoseResult<NodeKind[]>;
    inProgress: boolean;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
    errorMessage: string;
  };
