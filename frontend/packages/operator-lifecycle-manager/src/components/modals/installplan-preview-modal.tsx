import * as React from 'react';
import { safeDump } from 'js-yaml';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@console/internal/components/factory/modal';
import { ActionGroup, Button } from '@patternfly/react-core';
import { ResourceLink, CopyToClipboard } from '@console/internal/components/utils';
import { referenceForStepResource } from '../index';
import { StepResource } from '../../types';
import { useTranslation } from 'react-i18next';

const InstallPlanPreview: React.FC<InstallPlanPreviewModalProps> = ({ cancel, stepResource }) => {
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
        <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
          <Button type="button" variant="secondary" onClick={() => cancel()}>
            {t('public~OK')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </div>
  );
};

export const installPlanPreviewModal = createModalLauncher<InstallPlanPreviewModalProps>(
  InstallPlanPreview,
);

export type InstallPlanPreviewModalProps = {
  stepResource: StepResource;
  cancel?: () => void;
  close?: () => void;
};

InstallPlanPreview.displayName = 'InstallPlanPreview';
