import * as React from 'react';
import * as _ from 'lodash';
import {
  withHandlePromise,
  HandlePromiseProps,
  FirehoseResult,
} from '@console/internal/components/utils';
import { Button, ButtonVariant, Split, SplitItem } from '@patternfly/react-core';
import { ModalTitle, ModalBody, ModalComponentProps } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { K8sResourceKind, k8sPatch } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getVMLikeModel } from '../../../../selectors/vm';
import { getVMLikeAffinity } from '../../../../selectors/vm-like/selectors';
import { getLoadedData, isLoaded, getLoadError } from '../../../../utils';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';
import { ModalFooter } from '../../modal/modal-footer';
import { AFFINITY_MODAL_TITLE, AFFINITY_CREATE, AFFINITY_EDITING } from '../shared/consts';
import { AffinityTable } from './components/affinity-table/affinity-table';
import { AffinityRow } from './components/affinity-table/affinity-row';
import { AffinityEdit } from './components/affinity-edit/affinity-edit';
import { AffinityRowData } from './types';
import {
  getRowsDataFromAffinity,
  getAffinityFromRowsData,
  defaultNewAffinity,
  columnClasses,
} from './helpers';
import { getAffinityPatch } from '../../../../k8s/patches/vm/vm-scheduling-patches';
import './affinity-modal.scss';

export const AffinityModal = withHandlePromise<AffinityModalProps>(
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
    const currentAffinity = getVMLikeAffinity(vmLikeFinal);

    const [affinities, setAffinities] = React.useState<AffinityRowData[]>(
      getRowsDataFromAffinity(currentAffinity),
    );
    const [focusedAffinity, setFocusedAffinity] = React.useState<AffinityRowData>(
      defaultNewAffinity,
    );

    const [isEditing, setIsEditing] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [showCollisionAlert, reload] = useCollisionChecker<VMLikeEntityKind>(
      vmLikeFinal,
      (oldVM: VMLikeEntityKind, newVM: VMLikeEntityKind) =>
        _.isEqual(getVMLikeAffinity(oldVM), getVMLikeAffinity(newVM)),
    );

    const onReload = () => {
      reload();
      setAffinities(getRowsDataFromAffinity(currentAffinity));
      setIsCreating(false);
    };

    const onAffinityAdd = (affinity: AffinityRowData) => {
      setAffinities([...affinities, affinity]);
      setIsEditing(false);
      setIsCreating(false);
    };

    const onAffinityChange = (updatedAffinity: AffinityRowData) => {
      setAffinities(
        affinities.map((affinity) => {
          if (affinity.id === updatedAffinity.id) return { ...affinity, ...updatedAffinity };
          return affinity;
        }),
      );
      setIsEditing(false);
    };

    const onAffinityClickAdd = () => {
      setIsEditing(true);
      setIsCreating(true);
      setFocusedAffinity(defaultNewAffinity);
    };

    const onAffinityClickEdit = (affinity: AffinityRowData) => {
      setFocusedAffinity(affinity);
      setIsEditing(true);
    };

    const onAffinityDelete = (affinity: AffinityRowData) =>
      setAffinities(affinities.filter(({ id }) => id !== affinity.id));

    const submit = async () => {
      if (!_.isEqual(affinities, getRowsDataFromAffinity(currentAffinity))) {
        // eslint-disable-next-line promise/catch-or-return
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getAffinityPatch(vmLikeFinal, getAffinityFromRowsData(affinities)),
          ),
        ).then(close);
      } else {
        close();
      }
    };

    const onCancel = () => {
      if (isEditing) {
        setIsEditing(false);
        setIsCreating(false);
      } else {
        close();
      }
    };

    const modalTitle = !isEditing
      ? AFFINITY_MODAL_TITLE
      : isCreating
      ? AFFINITY_CREATE
      : AFFINITY_EDITING;

    return (
      <div className="modal-content">
        <Split>
          <SplitItem>
            <ModalTitle>{modalTitle}</ModalTitle>
          </SplitItem>
          <SplitItem isFilled />
          <SplitItem className="affinity-modal__add-btn">
            {!isEditing && (
              <Button onClick={() => onAffinityClickAdd()} variant="secondary">
                Add Affinity
              </Button>
            )}
          </SplitItem>
        </Split>
        {isEditing ? (
          <AffinityEdit
            nodes={nodes}
            affinity={focusedAffinity}
            onAffinitySubmit={isCreating ? onAffinityAdd : onAffinityChange}
            onCancel={onCancel}
          />
        ) : (
          <>
            <ModalBody>
              <AffinityTable
                columnClasses={columnClasses}
                data={affinities}
                customData={{
                  isDisabled: false,
                  vmLikeFinal,
                  onEdit: onAffinityClickEdit,
                  onDelete: onAffinityDelete,
                }}
                row={AffinityRow}
              />
            </ModalBody>
            <ModalFooter
              id="affinity"
              className="kubevirt-affinity__footer"
              errorMessage={errorMessage}
              inProgress={!isLoaded(nodes) || inProgress}
              isSimpleError={!!loadError}
              onSubmit={submit}
              onCancel={onCancel}
              submitButtonText={'Apply'}
              infoTitle={showCollisionAlert && 'Affinity has been updated outside this flow.'}
              infoMessage={
                <>
                  Saving these changes will override any Affinity previously saved.
                  <br />
                  <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                    Reload Affinity
                  </Button>
                  .
                </>
              }
            />
          </>
        )}
      </div>
    );
  },
);

type AffinityModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    nodes?: FirehoseResult<K8sResourceKind[]>;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  };
