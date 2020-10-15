import * as React from 'react';
import { Stack, StackItem, Checkbox } from '@patternfly/react-core';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';

import { ModalFooter } from '../modal/modal-footer';
import { SUPPORT_URL } from '../../../constants';
import { BlueInfoCircleIcon } from '@console/shared';

type SupportModalProps = ModalComponentProps & {
  onConfirm: (disable: boolean) => void;
};

const SupportModal: React.FC<SupportModalProps> = ({ onConfirm, close }) => {
  const [doNotShow, setDoNotShow] = React.useState(false);
  return (
    <div className="modal-content">
      <ModalTitle>
        <BlueInfoCircleIcon className="co-icon-space-r" />
        Template support
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>This template is not fully supported by Red Hat.</StackItem>
          <StackItem>
            <ExternalLink
              href={SUPPORT_URL}
              text="Learn more about Red Hat's third party support policy"
            />
          </StackItem>
          <StackItem>
            <Checkbox
              id="support-warning"
              label="Do not show this warning again"
              onChange={setDoNotShow}
              isChecked={doNotShow}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter
        submitButtonText="Continue"
        onSubmit={() => {
          close();
          onConfirm(doNotShow);
        }}
        onCancel={close}
      />
    </div>
  );
};

export const createSupportModal = createModalLauncher(SupportModal);
