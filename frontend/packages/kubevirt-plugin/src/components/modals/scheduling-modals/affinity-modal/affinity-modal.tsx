import * as React from 'react';
import * as _ from 'lodash';
import {
  withHandlePromise,
  HandlePromiseProps,
  FirehoseResult,
} from '@console/internal/components/utils';
import {
  Button,
  ButtonVariant,
  Split,
  SplitItem,
  Text,
  TextVariants,
  EmptyState,
  EmptyStateVariant,
  Title,
  EmptyStateBody,
} from '@patternfly/react-core';
import { ModalTitle, ModalBody, ModalComponentProps } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { NodeKind, k8sPatch } from '@console/internal/module/k8s';
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

import '../shared/scheduling-modals.scss';

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
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getAffinityPatch(vmLikeFinal, getAffinityFromRowsData(affinities)),
          ),
          close,
        );
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
          <SplitItem className="scheduling-modals__add-btn">
            {!isEditing && affinities.length > 0 && (
              <Button onClick={() => onAffinityClickAdd()} variant="secondary">
                Add Affinity rule
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
              {affinities.length > 0 && (
                <div className="scheduling-modals__desc-container">
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {
                      'Set scheduling requirements and affect the ranking of the nodes candidate for scheduling.'
                    }
                  </Text>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {
                      "Rules with 'Preferred' condition will stack with an 'AND' relation between them."
                    }
                  </Text>

                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {
                      "Rules with 'Required' condition will stack with an 'OR' relation between them."
                    }
                  </Text>
                </div>
              )}
              {affinities.length > 0 ? (
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
              ) : (
                <EmptyState variant={EmptyStateVariant.full}>
                  <Title headingLevel="h5" size="lg">
                    No Affinity rules found
                  </Title>
                  <EmptyStateBody>
                    <div className="scheduling-modals__desc-container">
                      <Text className="scheduling-modals__desc" component={TextVariants.small}>
                        {
                          'Set scheduling requirements and affect the ranking of the nodes candidate for scheduling.'
                        }
                      </Text>
                      <Text className="scheduling-modals__desc" component={TextVariants.small}>
                        {
                          "Rules with 'Preferred' condition will stack with an 'AND' relation between them."
                        }
                      </Text>

                      <Text className="scheduling-modals__desc" component={TextVariants.small}>
                        {
                          "Rules with 'Required' condition will stack with an 'OR' relation between them."
                        }
                      </Text>
                    </div>
                  </EmptyStateBody>
                  <Button variant="secondary" onClick={() => onAffinityClickAdd()}>
                    Add Affinity rule
                  </Button>
                </EmptyState>
              )}
            </ModalBody>
            <ModalFooter
              id="affinity"
              className="kubevirt-affinity__footer"
              errorMessage={errorMessage}
              inProgress={!isLoaded(nodes) || inProgress}
              isSimpleError={!!loadError}
              onSubmit={submit}
              onCancel={onCancel}
              submitButtonText={'Save'}
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
    nodes?: FirehoseResult<NodeKind[]>;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  };
