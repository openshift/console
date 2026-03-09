import type { FC } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { safeDump } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { ResourceLink, CopyToClipboard } from '@console/internal/components/utils';
import type { StepResource } from '../../types';
import { referenceForStepResource } from '../index';

export const InstallPlanPreview: FC<InstallPlanPreviewModalProps> = ({ cancel, stepResource }) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader
        title={
          <>
            {t('olm~InstallPlan Preview')}{' '}
            <ResourceLink
              linkTo={false}
              name={stepResource.name}
              kind={referenceForStepResource(stepResource)}
            />
          </>
        }
        data-test-id="modal-title"
      />
      <ModalBody>
        <CopyToClipboard value={safeDump(JSON.parse(stepResource.manifest))} />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={() => cancel()}>
          {t('public~OK')}
        </Button>
      </ModalFooter>
    </>
  );
};

export type InstallPlanPreviewModalProps = {
  stepResource: StepResource;
} & ModalComponentProps;

export const InstallPlanPreviewModalOverlay: OverlayComponent<InstallPlanPreviewModalProps> = (
  props,
) => {
  return (
    <Modal variant={ModalVariant.medium} isOpen onClose={props.closeOverlay}>
      <InstallPlanPreview {...props} cancel={props.closeOverlay} close={props.closeOverlay} />
    </Modal>
  );
};

InstallPlanPreview.displayName = 'InstallPlanPreview';
