import * as React from 'react';
import { Checkbox, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ExternalLink, ResourceLink } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { TemplateKind } from '@console/internal/module/k8s';
import { ModalFooter } from '../modal/modal-footer';

import './finish-customization-modal.scss';

const FinishCustomizationModal: React.FC<FinishCustomizationModalProps> = ({
  close,
  setFinish,
  vmTemplate,
}) => {
  const [confirmed, setConfirmed] = React.useState(false);
  const { t } = useTranslation();

  return (
    <div className="modal-content">
      <ModalTitle>
        {t('kubevirt-plugin~Finish customization and make template available')}
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'kubevirt-plugin~The following template will become available for virtual machine creation with the customized boot source:',
            )}
          </StackItem>
          <StackItem>
            <ResourceLink
              kind={TemplateModel.kind}
              name={vmTemplate.metadata.name}
              namespace={vmTemplate.metadata.namespace}
              linkTo={false}
            />
          </StackItem>
          <StackItem>
            <Checkbox
              id="confirm-seal"
              label={t(
                'kubevirt-plugin~I have sealed the boot source so it can be used as a template.*',
              )}
              onChange={setConfirmed}
              isChecked={confirmed}
              className="kv-finish-modal__checkbox"
            />
            <ExternalLink href="foo">
              {t('kubevirt-plugin~How to seal boot source for template usage')}
            </ExternalLink>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter
        isDisabled={!confirmed}
        submitButtonText={t('kubevirt-plugin~Apply')}
        onSubmit={() => {
          setFinish(true);
          close();
        }}
        onCancel={close}
      />
    </div>
  );
};

type FinishCustomizationModalProps = {
  setFinish: React.Dispatch<boolean>;
  vmTemplate: TemplateKind;
} & ModalComponentProps;

const finishCustomizationModal = createModalLauncher(FinishCustomizationModal);

export default finishCustomizationModal;
