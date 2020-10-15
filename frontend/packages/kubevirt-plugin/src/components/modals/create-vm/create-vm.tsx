import * as React from 'react';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
} from '@console/internal/components/factory';
import { history } from '@console/internal/components/utils';

import { ModalFooter } from '../modal/modal-footer';
import { getVMWizardCreateLink } from '../../../utils/url';
import { VMWizardName, VMWizardMode } from '../../../constants';
import { SuccessResultsComponent } from '../../create-vm-wizard/tabs/result-tab/success-results';
import { TemplateSourceStatusBundle } from '../../../statuses/template/types';
import { formReducer, initFormState } from '../../create-vm/forms/create-vm-form-reducer';
import { CreateVMForm } from '../../create-vm/forms/create-vm-form';
import { TemplateItem } from '../../../types/template';
import { useNamespace } from '../../../hooks/use-namespace';
import { useStorageClassConfigMap } from '../../../hooks/storage-class-config-map';
import { createVM } from '../../../k8s/requests/vm/create/simple-create';

const CreateVMModal: React.FC<CreateVMModalProps> = ({ close, cancel, sourceStatus, template }) => {
  const [isCreated, setCreated] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [createError, setCreateError] = React.useState<string>();
  const initNamespace = useNamespace();
  const [state, dispatch] = React.useReducer(formReducer, initFormState(initNamespace));

  const [scConfigMap, scLoaded, scError] = useStorageClassConfigMap();

  const onCustomize = () => {
    close();
    history.push(
      getVMWizardCreateLink({
        namespace: state.namespace,
        wizardName: VMWizardName.WIZARD,
        mode: VMWizardMode.VM,
        template: state.template,
        name: state.name,
        startVM: state.startVM,
      }),
    );
  };
  return (
    <div className="modal-content modal-content--no-inner-scroll">
      {isCreated ? (
        <SuccessResultsComponent name={state.name} namespace={state.namespace} onClick={close} />
      ) : (
        <>
          <ModalTitle>Create Virtual Machine from template</ModalTitle>
          <ModalBody>
            <CreateVMForm
              dispatch={dispatch}
              state={state}
              template={template}
              sourceStatus={sourceStatus}
              onCustomize={onCustomize}
            />
          </ModalBody>
          <ModalFooter
            submitButtonText="Create virtual machine"
            saveAndRestartText="Customize virtual machine"
            isSaveAndRestart
            isDisabled={
              !state.isValid ||
              isSubmitting ||
              (sourceStatus?.isCDRom ? !scLoaded || !!scError : false)
            }
            errorMessage={createError || (sourceStatus?.isCDRom ? scError : undefined)}
            onSubmit={async () => {
              try {
                setSubmitting(true);
                await createVM(state.template, sourceStatus, undefined, state, scConfigMap);
                setCreated(true);
              } catch (err) {
                setCreateError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
            onSaveAndRestart={onCustomize}
            onCancel={cancel}
          />
        </>
      )}
    </div>
  );
};

type CreateVMModalProps = ModalComponentProps & {
  template: TemplateItem;
  sourceStatus: TemplateSourceStatusBundle;
};

export const createVMModal = createModalLauncher(CreateVMModal);
