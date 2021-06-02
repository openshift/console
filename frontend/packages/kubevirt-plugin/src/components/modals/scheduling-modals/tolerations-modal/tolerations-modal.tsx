import * as React from 'react';
import { Button, ButtonVariant, Text, TextVariants } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import {
  ExternalLink,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { k8sPatch, NodeKind } from '@console/internal/module/k8s';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';
import { useIDEntities } from '../../../../hooks/use-id-entities';
import { getTolerationsPatch } from '../../../../k8s/patches/vm/vm-scheduling-patches';
import { getVMLikeModel } from '../../../../selectors/vm';
import { getVMLikeTolerations } from '../../../../selectors/vm-like/selectors';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getLoadedData, getLoadError, isLoaded } from '../../../../utils';
import { LabelsList } from '../../../LabelsList/labels-list';
import { ModalFooter } from '../../modal/modal-footer';
import { TOLERATIONS_EFFECTS } from '../shared/consts';
import { useNodeQualifier } from '../shared/hooks';
import { NodeChecker } from '../shared/NodeChecker/node-checker';
import { TolerationHeader } from './toleration-header';
import { TolerationRow } from './toleration-row';
import { TolerationLabel } from './types';

import '../shared/scheduling-modals.scss';

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
    const { t } = useTranslation();
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
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getTolerationsPatch(vmLikeFinal, k8sTolerations),
          ),
          close,
        );
      } else {
        close();
      }
    };

    return (
      <div className="modal-content">
        <ModalTitle>{t('kubevirt-plugin~Tolerations')}</ModalTitle>
        <ModalBody>
          <div className="scheduling-modals__desc-container">
            <Text className="scheduling-modals__desc" component={TextVariants.small}>
              {t(
                'kubevirt-plugin~Tolerations are applied to VMs, and allow (but do not require) the VMs to schedule onto nodes with matching taints.',
              )}
            </Text>
            <Text className="scheduling-modals__desc" component={TextVariants.small}>
              {t(
                'kubevirt-plugin~Add tolerations to allow a VM to schedule onto nodes with matching taints.',
              )}
            </Text>
            <ExternalLink
              text={t('kubevirt-plugin~Taints and Tolerations documentation')}
              href={
                'https://kubevirt.io/user-guide/#/usage/node-placement?id=taints-and-tolerations'
              }
            />
          </div>
          <LabelsList
            isEmpty={tolerationsLabels.length === 0}
            kind="Node"
            onLabelAdd={onTolerationAdd}
            addRowText={t('kubevirt-plugin~Add Toleration')}
            emptyStateAddRowText={t('kubevirt-plugin~Add Toleration to specify qualifying nodes')}
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
          {tolerationsLabels.length > 0 && isLoaded(nodes) && !inProgress && !loadError && (
            <NodeChecker
              qualifiedNodes={qualifiedNodes}
              warningTitle={t('kubevirt-plugin~No matching tainted nodes found')}
              warningMessage={t('kubevirt-plugin~No new nodes will be added to scheduler')}
            />
          )}
        </ModalBody>
        <ModalFooter
          id="tolerations"
          errorMessage={errorMessage}
          inProgress={!isLoaded(nodes) || inProgress}
          isSimpleError={!!loadError}
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText={t('kubevirt-plugin~Save')}
          infoTitle={
            showCollisionAlert &&
            t('kubevirt-plugin~Tolerations has been updated outside this flow.')
          }
          infoMessage={
            <>
              {t(
                'kubevirt-plugin~Saving these changes will override any Tolerations previously saved.',
              )}
              <br />
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                {t('kubevirt-plugin~Reload Tolerations')}
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
