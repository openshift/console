import type { FC } from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { safeDump } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { ResourceLink, CopyToClipboard } from '@console/internal/components/utils';
import { StepResource } from '../../types';
import { referenceForStepResource } from '../index';

export const InstallPlanPreview: FC<InstallPlanPreviewModalProps> = ({ cancel, stepResource }) => {
  const { t } = useTranslation();
  return (
    <div className="modal-content">
      <ModalTitle>
        {t('olm~InstallPlan Preview')}{' '}
        <ResourceLink
          linkTo={false}
          name={stepResource.name}
          kind={referenceForStepResource(stepResource)}
        />
      </ModalTitle>
      <ModalBody>
        <CopyToClipboard value={safeDump(JSON.parse(stepResource.manifest))} />
      </ModalBody>
      <ModalFooter inProgress={false}>
        <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right pf-v6-c-form__group--no-top-margin">
          <Button type="button" variant="secondary" onClick={() => cancel()}>
            {t('public~OK')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </div>
  );
};

const InstallPlanPreviewModalProvider: OverlayComponent<InstallPlanPreviewModalProviderProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <InstallPlanPreview stepResource={props.stepResource} cancel={props.closeOverlay} />
    </ModalWrapper>
  );
};

type InstallPlanPreviewModalProviderProps = {
  stepResource: StepResource;
  // closeOverlay is added automatically by OverlayComponent wrapper
};

export type InstallPlanPreviewModalProps = {
  stepResource: StepResource;
  cancel?: () => void;
  close?: () => void;
};

export { InstallPlanPreviewModalProvider };

InstallPlanPreview.displayName = 'InstallPlanPreview';
