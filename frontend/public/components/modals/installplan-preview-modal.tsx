import * as React from 'react';
import { safeDump } from 'js-yaml';

import { createModalLauncher, ModalTitle, ModalBody, ModalFooter } from '../factory/modal';
import { StepResource, referenceForStepResource } from '../operator-lifecycle-manager';
import { ResourceLink, CopyToClipboard } from '../utils';

export const installPlanPreviewModal = createModalLauncher<InstallPlanPreviewModalProps>(({cancel, stepResource}) => <div className="modal-content">
  <ModalTitle>Install Plan Preview <ResourceLink linkTo={false} name={stepResource.name} kind={referenceForStepResource(stepResource)} /></ModalTitle>
  <ModalBody>
    <CopyToClipboard value={safeDump(JSON.parse(stepResource.manifest))} />
  </ModalBody>
  <ModalFooter inProgress={false}>
    <button type="button" onClick={() => cancel()} className="btn btn-default">OK</button>
  </ModalFooter>
</div>);

export type InstallPlanPreviewModalProps = {
  stepResource: StepResource;
  cancel: () => void;
  close: () => void;
};
