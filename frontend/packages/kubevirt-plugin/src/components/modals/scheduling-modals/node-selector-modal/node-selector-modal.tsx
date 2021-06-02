import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import {
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { k8sPatch, NodeKind } from '@console/internal/module/k8s';
import { useCollisionChecker } from '../../../../hooks/use-collision-checker';
import { useIDEntities } from '../../../../hooks/use-id-entities';
import { getNodeSelectorPatches } from '../../../../k8s/patches/vm/vm-scheduling-patches';
import { getVMLikeModel } from '../../../../selectors/vm';
import { getVMLikeNodeSelector } from '../../../../selectors/vm-like/selectors';
import { VMLikeEntityKind } from '../../../../types/vmLike';
import { getLoadedData, getLoadError, isLoaded } from '../../../../utils';
import { LabelRow } from '../../../LabelsList/LabelRow/label-row';
import { LabelsList } from '../../../LabelsList/labels-list';
import { IDLabel } from '../../../LabelsList/types';
import { ModalFooter } from '../../modal/modal-footer';
import { useNodeQualifier } from '../shared/hooks';
import { NodeChecker } from '../shared/NodeChecker/node-checker';
import { nodeSelectorToIDLabels } from './helpers';
import { NodeSelectorHeader } from './node-selector-header';

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
    const { t } = useTranslation();
    const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity);
    const loadError = getLoadError(nodes, NodeModel);

    const [
      selectorLabels,
      setSelectorLabels,
      onLabelAdd,
      onLabelChange,
      onLabelDelete,
    ] = useIDEntities<IDLabel>(nodeSelectorToIDLabels(getVMLikeNodeSelector(vmLikeEntity)));

    const qualifiedNodes = useNodeQualifier(nodes, 'label', selectorLabels);
    const [showCollisionAlert, reload] = useCollisionChecker<VMLikeEntityKind>(
      vmLikeFinal,
      (oldVM: VMLikeEntityKind, newVM: VMLikeEntityKind) =>
        _.isEqual(getVMLikeNodeSelector(oldVM), getVMLikeNodeSelector(newVM)),
    );

    const onSelectorLabelAdd = () => onLabelAdd({ id: null, key: '', value: '' } as IDLabel);

    const onReload = () => {
      reload();
      setSelectorLabels(nodeSelectorToIDLabels(getVMLikeNodeSelector(vmLikeFinal)));
    };

    const onSubmit = async () => {
      const k8sSelector = selectorLabels.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {});

      if (!_.isEqual(getVMLikeNodeSelector(vmLikeFinal), k8sSelector)) {
        handlePromise(
          k8sPatch(
            getVMLikeModel(vmLikeFinal),
            vmLikeFinal,
            await getNodeSelectorPatches(vmLikeFinal, k8sSelector),
          ),
          close,
        );
      } else {
        close();
      }
    };

    return (
      <div className="modal-content">
        <ModalTitle>{t('kubevirt-plugin~Node Selector')}</ModalTitle>
        <ModalBody>
          <LabelsList
            isEmpty={selectorLabels.length === 0}
            kind="Node"
            onLabelAdd={onSelectorLabelAdd}
          >
            {selectorLabels.length > 0 && (
              <>
                <NodeSelectorHeader key="label-title-row" />
                {selectorLabels.map((label) => (
                  <LabelRow
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
          id="node-selector"
          errorMessage={errorMessage}
          inProgress={!isLoaded(nodes) || inProgress}
          isSimpleError={!!loadError}
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText={t('kubevirt-plugin~Save')}
          infoTitle={
            showCollisionAlert &&
            t('kubevirt-plugin~Node Selector has been updated outside this flow.')
          }
          infoMessage={
            <Trans t={t} i18nKey="nodeSelectorModal" ns="kubevirt-plugin">
              Saving these changes will override any Node Selector previously saved.
              <br />
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                Reload Node Selector
              </Button>
              .
            </Trans>
          }
        />
      </div>
    );
  },
);

type NSModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    nodes?: FirehoseResult<NodeKind[]>;
    inProgress: boolean;
    vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
    errorMessage: string;
  };
