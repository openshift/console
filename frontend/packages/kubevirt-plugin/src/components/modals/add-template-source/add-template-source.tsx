import * as React from 'react';
import { k8sCreate, TemplateKind } from '@console/internal/module/k8s';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalFooter,
} from '@console/internal/components/factory';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { Alert, Button, ActionGroup, Stack, StackItem } from '@patternfly/react-core';
import { useAccessReview2, LoadingBox } from '@console/internal/components/utils';
import { UploadPVCFormStatus } from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form-status';
import { createUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import {
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  DataVolumeSourceType,
} from '../../../constants';
import { getParameterValue } from '../../../selectors/selectors';
import { DataVolumeModel } from '../../../models';
import { CDIUploadContextProps } from '../../cdi-upload-provider/cdi-upload-provider';
import { bootFormReducer, initBootFormState } from '../../create-vm/forms/boot-source-form-reducer';
import { BootSourceForm } from '../../create-vm/forms/boot-source-form';
import { getRootDataVolume } from '../../../k8s/requests/vm/create/simple-create';

const getAction = (dataSource: string): string => {
  switch (DataVolumeSourceType.fromString(dataSource)) {
    case DataVolumeSourceType.HTTP:
    case DataVolumeSourceType.REGISTRY:
    case DataVolumeSourceType.S3:
      return 'import';
    case DataVolumeSourceType.PVC:
      return 'clone';
    default:
      return 'upload';
  }
};

type PermissionsErrorProps = {
  close: VoidFunction;
};

const PermissionsError: React.FC<PermissionsErrorProps> = ({ close }) => (
  <>
    <ModalBody>
      <Alert variant="danger" isInline title="Permissions required">
        You do not have permissions to upload template source data into this namespace. Contact your
        system administrator for more information.
      </Alert>
    </ModalBody>
    <ModalFooter inProgress={false}>
      <Button type="button" data-test-id="modal-close-action" onClick={close}>
        Close
      </Button>
    </ModalFooter>
  </>
);

type AddTemplateSourceModalProps = CDIUploadContextProps & {
  template: TemplateKind;
};

export const AddTemplateSourceModal: React.FC<ModalComponentProps &
  AddTemplateSourceModalProps> = ({ cancel, uploadData, close, template, uploads }) => {
  const baseImageName = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
  const baseImageNamespace = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);
  const upload = uploads.find(
    (upl) => upl.pvcName === baseImageName && upl.namespace === baseImageNamespace,
  );
  const [isAllocating, setAllocating] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [state, dispatch] = React.useReducer(bootFormReducer, initBootFormState);

  const [uploadAllowed, uploadAllowedLoading] = useAccessReview2({
    group: DataVolumeModel.apiGroup,
    resource: DataVolumeModel.plural,
    verb: 'create',
  });

  const { dataSource, file, isValid } = state;

  const onSubmit = async () => {
    setAllocating(true);
    setSubmitting(true);
    const dvObj = getRootDataVolume({
      name: baseImageName,
      pvcSize: state.pvcSize?.value,
      sizeValue: state.size?.value.value,
      sizeUnit: state.size?.value.unit,
      accessMode: state.accessMode?.value,
      cdRom: state.cdRom?.value,
      container: state.container?.value,
      pvcName: state.pvcName?.value,
      pvcNamespace: state.pvcNamespace?.value,
      url: state.url?.value,
      dataSource: state.dataSource?.value,
      storageClass: state.storageClass?.value,
    })
      .setNamespace(baseImageNamespace)
      .asResource();
    try {
      if (dataSource?.value === DataVolumeSourceType.PVC.getValue()) {
        const { token } = await createUploadPVC(dvObj);
        setAllocating(false);
        uploadData({
          file: file.value?.value,
          token,
          pvcName: dvObj.metadata.name,
          namespace: dvObj.metadata.namespace,
        });
      } else {
        await k8sCreate(DataVolumeModel, dvObj);
      }
      close();
    } catch ({ message }) {
      setError(message || 'Could not create persistent volume claim.');
    } finally {
      setAllocating(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Add source to vendor template</ModalTitle>
      {uploadAllowedLoading ? (
        <LoadingBox />
      ) : uploadAllowed ? (
        <>
          <ModalBody>
            {!isSubmitting && (
              <Stack hasGutter>
                <StackItem>
                  This data can be found in{' '}
                  <b>
                    Storage &gt; {PersistentVolumeClaimModel.labelPlural} &gt; {baseImageName}
                  </b>{' '}
                  under the <b>{baseImageNamespace}</b> namespace.
                </StackItem>
                <StackItem>
                  <BootSourceForm state={state} dispatch={dispatch} withUpload />
                </StackItem>
              </Stack>
            )}
            <UploadPVCFormStatus
              upload={upload}
              isSubmitting={isSubmitting}
              isAllocating={isAllocating}
              allocateError={undefined}
              onErrorClick={() => {
                setSubmitting(false);
                setError(undefined);
              }}
            />
          </ModalBody>
          <ModalFooter errorMessage={error} inProgress={false}>
            <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
              <Button
                type="button"
                variant="secondary"
                data-test-id="modal-cancel-action"
                onClick={cancel}
              >
                Close
              </Button>
              <Button
                variant="primary"
                isDisabled={!isValid || isSubmitting}
                data-test="confirm-action"
                id="confirm-action"
                onClick={onSubmit}
              >
                {`Save and ${getAction(dataSource?.value)}`}
              </Button>
            </ActionGroup>
          </ModalFooter>
        </>
      ) : (
        <PermissionsError close={close} />
      )}
    </div>
  );
};

export const addTemplateSourceModal = createModalLauncher(AddTemplateSourceModal);
