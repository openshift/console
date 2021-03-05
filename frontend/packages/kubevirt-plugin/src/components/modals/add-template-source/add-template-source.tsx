import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { k8sCreate, TemplateKind } from '@console/internal/module/k8s';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalFooter,
} from '@console/internal/components/factory';
import { Alert, Button, ActionGroup, Stack, StackItem } from '@patternfly/react-core';
import { useAccessReview2, LoadingBox } from '@console/internal/components/utils';
import { coFetch } from '@console/internal/co-fetch';

import {
  UploadPVCFormStatus,
  uploadErrorType,
} from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form-status';
import { createUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import {
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
} from '../../../constants';
import { getParameterValue } from '../../../selectors/selectors';
import { DataVolumeModel } from '../../../models';
import { CDIUploadContextProps } from '../../cdi-upload-provider/cdi-upload-provider';
import { bootFormReducer, initBootFormState } from '../../create-vm/forms/boot-source-form-reducer';
import { BootSourceForm } from '../../create-vm/forms/boot-source-form';
import { getRootDataVolume } from '../../../k8s/requests/vm/create/simple-create';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { useErrorTranslation } from '../../../hooks/use-error-translation';
import {
  CDI_UPLOAD_URL_BUILDER,
  CDI_BIND_REQUESTED_ANNOTATION,
} from '../../cdi-upload-provider/consts';
import { uploadErrorMessage } from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form';

const getAction = (t: TFunction, dataSource: string): string => {
  switch (ProvisionSource.fromString(dataSource)) {
    case ProvisionSource.URL:
    case ProvisionSource.CONTAINER:
      return t('kubevirt-plugin~Save and import');
    case ProvisionSource.DISK:
      return t('kubevirt-plugin~Save and clone');
    default:
      return t('kubevirt-plugin~Save and upload');
  }
};

type PermissionsErrorProps = {
  close: VoidFunction;
};

const PermissionsError: React.FC<PermissionsErrorProps> = ({ close }) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalBody>
        <Alert variant="danger" isInline title={t('kubevirt-plugin~Permissions required')}>
          {t(
            'kubevirt-plugin~You do not have permissions to upload template source data into this namespace. Contact your system administrator for more information.',
          )}
        </Alert>
      </ModalBody>
      <ModalFooter inProgress={false}>
        <Button type="button" data-test-id="modal-close-action" onClick={close}>
          {t('kubevirt-plugin~Close')}
        </Button>
      </ModalFooter>
    </>
  );
};

type AddTemplateSourceModalProps = CDIUploadContextProps & {
  template: TemplateKind;
};

export const AddTemplateSourceModal: React.FC<ModalComponentProps &
  AddTemplateSourceModalProps> = ({
  cancel,
  uploadData,
  close,
  template,
  uploads,
  uploadProxyURL,
}) => {
  const { t } = useTranslation();
  const baseImageName = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
  const baseImageNamespace = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);
  const upload = uploads.find(
    (upl) => upl.pvcName === baseImageName && upl.namespace === baseImageNamespace,
  );
  const [isAllocating, setAllocating] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [isCheckingCert, setCheckingCert] = React.useState(false);
  const [error, setError, setErrorKey, resetError] = useErrorTranslation();
  const [state, dispatch] = React.useReducer(bootFormReducer, initBootFormState);

  const [uploadAllowed, uploadAllowedLoading] = useAccessReview2({
    group: DataVolumeModel.apiGroup,
    resource: DataVolumeModel.plural,
    verb: 'create',
  });

  const { dataSource, file, isValid } = state;

  const onSubmit = async () => {
    resetError();
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
      provider: state.provider?.value,
      volumeMode: state.volumeMode?.value,
    })
      .setNamespace(baseImageNamespace)
      .addAnotation(CDI_BIND_REQUESTED_ANNOTATION, 'true')
      .asResource();

    // t('kubevirt-plugin~Could not create Persistent volume claim')
    const handleCreateError = (err) =>
      err?.message
        ? setError(err.message)
        : setErrorKey('kubevirt-plugin~Could not create Persistent volume claim');

    if (dataSource?.value === ProvisionSource.UPLOAD.getValue()) {
      try {
        setCheckingCert(true);
        await coFetch(CDI_UPLOAD_URL_BUILDER(uploadProxyURL));
        setCheckingCert(false);
      } catch (err) {
        if (err?.response === undefined) {
          // the GET request will return an error everytime, but it will be undefined only if the certificate is invalid.
          const certError = uploadErrorMessage(t)[uploadErrorType.CERT];
          setError(certError(uploadProxyURL));
          return;
        }
      } finally {
        setCheckingCert(false);
      }
      try {
        setAllocating(true);
        setSubmitting(true);
        const { token } = await createUploadPVC(dvObj);
        setAllocating(false);
        uploadData({
          file: file.value?.value,
          token,
          pvcName: dvObj.metadata.name,
          namespace: dvObj.metadata.namespace,
        });
        close();
      } catch (err) {
        handleCreateError(err);
      } finally {
        setAllocating(false);
        setSubmitting(false);
      }
    } else {
      try {
        setAllocating(true);
        setSubmitting(true);
        await k8sCreate(DataVolumeModel, dvObj);
        close();
      } catch (err) {
        handleCreateError(err);
      } finally {
        setAllocating(false);
        setSubmitting(false);
      }
    }
  };

  let body: React.ReactNode;

  if (!baseImageName || !baseImageNamespace) {
    body = (
      <>
        <ModalBody>
          <Alert variant="danger" isInline title={t('kubevirt-plugin~No base image specified')}>
            {t(
              'kubevirt-plugin~You cannot add source to this template because it is missing base image specification.',
            )}
          </Alert>
        </ModalBody>
        <ModalFooter inProgress={false}>
          <Button type="button" data-test-id="modal-close-action" onClick={close}>
            {t('kubevirt-plugin~Close')}
          </Button>
        </ModalFooter>
      </>
    );
  } else if (uploadAllowedLoading) {
    body = <LoadingBox />;
  } else if (!uploadAllowed) {
    body = <PermissionsError close={close} />;
  } else {
    body = (
      <>
        <ModalBody>
          {!isSubmitting && (
            <Stack hasGutter>
              <StackItem>
                <Trans t={t} ns="kubevirt-plugin">
                  This data can be found in{' '}
                  <b>Storage &gt; Persistent volume claims &gt; {baseImageName}</b> under the{' '}
                  <b>{baseImageNamespace}</b> project.
                </Trans>
              </StackItem>
              <StackItem>
                <BootSourceForm
                  state={state}
                  dispatch={dispatch}
                  withUpload
                  disabled={isCheckingCert}
                />
              </StackItem>
              <StackItem>
                <Alert
                  variant="info"
                  isInline
                  title={t(
                    'kubevirt-plugin~Customizing boot source will be available after the source is added',
                  )}
                >
                  {t(
                    "kubevirt-plugin~For customizing boot source, select 'Customize boot source' from the template actions menu.",
                  )}
                </Alert>
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
              resetError();
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
              {t('kubevirt-plugin~Close')}
            </Button>
            <Button
              variant="primary"
              isDisabled={!isValid || isSubmitting}
              data-test="confirm-action"
              id="confirm-action"
              onClick={onSubmit}
            >
              {getAction(t, dataSource?.value)}
            </Button>
          </ActionGroup>
        </ModalFooter>
      </>
    );
  }

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('kubevirt-plugin~Add boot source to template')}</ModalTitle>
      {body}
    </div>
  );
};

export const addTemplateSourceModal = createModalLauncher(AddTemplateSourceModal);
