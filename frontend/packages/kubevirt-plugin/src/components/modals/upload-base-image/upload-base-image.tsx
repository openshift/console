import * as React from 'react';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import {
  provisionerAccessModeMapping,
  getAccessModeForProvisioner,
  dropdownUnits,
} from '@console/internal/components/storage/shared';
import { apiVersionForModel, StorageClassResourceKind } from '@console/internal/module/k8s';
import { DataVolumeModel } from '../../../models';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
} from '@console/internal/components/factory';
import { UploadDataProps, DataUpload } from '../../cdi-upload-provider/cdi-upload-provider';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel } from '@console/internal/models';
import { Form, FormGroup, FileUpload } from '@patternfly/react-core';
import { RequestSizeInput } from '@console/internal/components/utils';
import { UploadPVCFormStatus } from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form-status';
import { TEMPLATE_VM_GOLDEN_OS_NAMESPACE } from '../../../constants';
import { getGefaultStorageClass } from '../../../selectors/config-map/sc-defaults';
import { createUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';

const getDataVolume = (
  { value, unit }: { value: string; unit: string },
  provisioner: string,
  name: string,
): V1alpha1DataVolume => {
  const accessModes = [
    (provisionerAccessModeMapping[provisioner] || getAccessModeForProvisioner(provisioner))[0],
  ];
  return {
    apiVersion: apiVersionForModel(DataVolumeModel),
    kind: DataVolumeModel.kind,
    metadata: {
      name,
      namespace: TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
    },
    spec: {
      source: {
        upload: {},
      },
      pvc: {
        accessModes,
        resources: {
          requests: {
            storage: `${value}${unit}`,
          },
        },
      },
    },
  };
};

export const UploadBaseImageModal: React.FC<ModalComponentProps & {
  uploadData: (props: UploadDataProps) => void;
  osName: string;
  upload: DataUpload;
}> = ({ cancel, uploadData, close, osName, upload }) => {
  const [file, setFile] = React.useState<{ name: string; value: File }>(null);
  const [size, setSize] = React.useState<{ value: string; unit: string }>({
    value: '25',
    unit: 'Gi',
  });
  const [isAllocating, setAllocating] = React.useState(false);
  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>({
    kind: StorageClassModel.kind,
    isList: true,
    namespaced: false,
  });
  const [isSubmitting, setSubmitting] = React.useState(false);

  const storageClass = getGefaultStorageClass(storageClasses);

  const submit = async (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    setAllocating(true);
    setSubmitting(true);
    const dvObj = getDataVolume(size, storageClass.provisioner, osName);
    try {
      const { token } = await createUploadPVC(dvObj);
      await uploadData({
        file: file.value,
        token,
        pvcName: dvObj.metadata.name,
        namespace: TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
      });
      setSubmitting(false);
      close();
    } catch ({ message }) {
      // setIsAllocating(false);
      // setError(message || 'Could not create persistent volume claim.');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>Add source to vendor template</ModalTitle>
      <ModalBody className="modal-body">
        {!isSubmitting && (
          <Form>
            <FormGroup fieldId="simple-form-name" label="Upload source" isRequired>
              <FileUpload
                id="file-upload"
                value={file?.value}
                filename={file?.name}
                onChange={(value: File, name: string) => setFile({ name, value })}
                hideDefaultPreview
                isRequired
              />
            </FormGroup>
            <FormGroup fieldId="simple-form-pvc" label="Disk size" isRequired>
              <RequestSizeInput
                name="requestSize"
                required
                onChange={setSize}
                defaultRequestSizeUnit={size.unit}
                defaultRequestSizeValue={size.value}
                dropdownUnits={dropdownUnits}
                describedBy="request-size-help"
                inputID="request-size-input"
              />
              <p className="help-block" id="request-size-help">
                Ensure your PVC size covers the requirements of the uncompressed image and any other
                space requirements
              </p>
            </FormGroup>
          </Form>
        )}
        <UploadPVCFormStatus
          upload={upload}
          isSubmitting={isSubmitting}
          isAllocating={isAllocating}
          allocateError={undefined}
          onErrorClick={() => {
            setSubmitting(false);
            // setError('');
          }}
          onSuccessClick={close}
          onCancelFinish={close}
        />
      </ModalBody>
      <ModalSubmitFooter
        submitDisabled={!file?.value || !scLoaded || isSubmitting}
        submitText="Save and upload"
        cancel={cancel}
        inProgress={false}
      />
    </form>
  );
};

export const uploadBaseImageModal = createModalLauncher(UploadBaseImageModal);
