import * as React from 'react';
import {
  provisionerAccessModeMapping,
  getAccessModeForProvisioner,
  dropdownUnits,
  accessModeRadios,
} from '@console/internal/components/storage/shared';
import {
  StorageClassResourceKind,
  PersistentVolumeClaimKind,
  k8sCreate,
  TemplateKind,
} from '@console/internal/module/k8s';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalFooter,
} from '@console/internal/components/factory';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel, PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import {
  Form,
  FileUpload,
  ExpandableSection,
  FormSelectOption,
  Alert,
  Button,
  Select,
  SelectOption,
  TextInput,
  FormSelect,
  ActionGroup,
} from '@patternfly/react-core';
import {
  RequestSizeInput,
  LoadingInline,
  useAccessReview2,
  ListDropdown,
  LoadingBox,
} from '@console/internal/components/utils';
import { UploadPVCFormStatus } from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form-status';
import { getDefaultStorageClass } from '../../../selectors/config-map/sc-defaults';
import { createUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import {
  DataVolumeSourceType,
  AccessMode,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
} from '../../../constants';
import { EXAMPLE_CONTAINER, FEDORA_IMAGE_LINK, RHEL_IMAGE_LINK } from '../../../utils/strings';
import { FormRow } from '../../form/form-row';
import ProjectDropdown from '../../form/ProjectDropdown';
import { getParameterValue } from '../../../selectors/selectors';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { DataVolumeModel } from '../../../models';
import { CDIUploadContextProps } from '../../cdi-upload-provider/cdi-upload-provider';

import './add-template-source.scss';

const DATA_SOURCE = {
  UPLOAD: 'Upload local file (creates PVC)',
  URL: 'Import via URL (creates PVC)',
  REGISTRY: 'Import via Registry (creates PVC)',
  CLONE: 'Clone existing PVC',
};

const DATA_SOURCES = [
  {
    value: DATA_SOURCE.UPLOAD,
    description: 'Upload file from your local device (supported types - gz, xz, tar, qcow2).',
    action: 'Upload',
  },
  {
    value: DATA_SOURCE.URL,
    description: 'Import content via URL (HTTP or S3 endpoint).',
    action: 'Import',
  },
  {
    value: DATA_SOURCE.REGISTRY,
    description: 'Import content via container registry.',
    action: 'Import',
  },
  {
    value: DATA_SOURCE.CLONE,
    description: 'Clone a persistent volume claim already available on the cluster and clone it.',
    action: 'Clone',
  },
];

type GetDataVolume = (
  dvOpts: { name: string; namespace: string },
  pvcOpts: { value: string; unit: string; accessMode: string; storageClass: string },
  source: {
    dataSource: string;
    url: string;
    pvcName: string;
    pvcNamespace: string;
    pvcSize: string;
    container: string;
  },
) => V1alpha1DataVolume;

const getDataVolume: GetDataVolume = (
  { name, namespace },
  { value, unit, accessMode, storageClass },
  { dataSource, url, pvcName, pvcNamespace, pvcSize, container },
) => {
  const dataVolume = new DataVolumeWrapper()
    .init({
      name,
      namespace,
      size: value,
      unit,
      storageClassName: storageClass,
    })
    .setAccessModes([AccessMode.fromString(accessMode)]);
  switch (dataSource) {
    case DATA_SOURCE.URL: {
      dataVolume.setType(DataVolumeSourceType.HTTP, { url });
      break;
    }
    case DATA_SOURCE.CLONE: {
      dataVolume
        .setType(DataVolumeSourceType.PVC, { name: pvcName, namespace: pvcNamespace })
        .setRawSize(pvcSize);
      break;
    }
    case DATA_SOURCE.REGISTRY: {
      dataVolume.setType(DataVolumeSourceType.REGISTRY, { url: `docker://${container}` });
      break;
    }
    default: {
      dataVolume.setType(DataVolumeSourceType.UPLOAD);
    }
  }
  return dataVolume.asResource();
};

type PermissionsErrorProps = {
  close: () => void;
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

type PVCSelectorProps = {
  setName: (name: string) => void;
  namespace: string;
  setPVCSize: (value: string) => void;
};

const PVCSelector: React.FC<PVCSelectorProps> = ({ setName, namespace, setPVCSize }) => {
  // TODO is this enough ?
  const [clonePodAllowed, clonePodAllowedLoading] = useAccessReview2({
    group: PodModel.apiGroup,
    resource: PodModel.plural,
    namespace,
    verb: 'create',
  });

  return (
    !!namespace && (
      <FormRow fieldId="form-ds-pvc" title={`${PersistentVolumeClaimModel.label} name`} isRequired>
        <ListDropdown
          resources={[
            {
              kind: PersistentVolumeClaimModel.kind,
              namespace,
            },
          ]}
          onChange={(val, kind, resource: PersistentVolumeClaimKind) => {
            setName(val);
            setPVCSize(resource.spec.resources.requests.storage);
          }}
          placeholder={`--- Select ${PersistentVolumeClaimModel.label} ---`}
          desc={PersistentVolumeClaimModel.label}
        />
        {!clonePodAllowedLoading && !clonePodAllowed && (
          <Alert variant="danger" isInline title="Permissions required">
            You do not have permissions to clone PVCs from this namespace.
          </Alert>
        )}
      </FormRow>
    )
  );
};

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
  const [dataSource, setDataSource] = React.useState(DATA_SOURCE.UPLOAD);
  const [isDataSourceOpen, setDataSourceOpen] = React.useState(false);
  const [file, setFile] = React.useState<{ name: string; value: File }>(null);
  const [url, setURL] = React.useState<string>();
  const [pvcName, setPVCName] = React.useState<string>();
  const [pvcNamespace, setPVCNamespace] = React.useState<string>();
  const [pvcSize, setPVCSize] = React.useState<string>();
  const [container, setContainer] = React.useState<string>();
  const [size, setSize] = React.useState<{ value: string; unit: string }>({
    value: '25',
    unit: 'Gi',
  });
  const [isAllocating, setAllocating] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [storageClass, setStorageClass] = React.useState<string>();
  const [accessMode, setAccessMode] = React.useState<string>();
  const [accessModes, setAccessModes] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string>();

  const [uploadAllowed, uploadAllowedLoading] = useAccessReview2({
    group: DataVolumeModel.apiGroup,
    resource: DataVolumeModel.plural,
    verb: 'create',
  });

  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>({
    kind: StorageClassModel.kind,
    isList: true,
    namespaced: false,
  });

  const defaultSCName = getDefaultStorageClass(storageClasses)?.metadata.name;

  const handleStorageClass = (scName: string) => {
    const updatedStorageClass = storageClasses.find((sc) => sc.metadata.name === scName);
    const provisioner = updatedStorageClass?.provisioner || '';
    const modes =
      provisionerAccessModeMapping[provisioner] || getAccessModeForProvisioner(provisioner);
    setAccessMode('ReadWriteOnce');
    setAccessModes(modes);
    setStorageClass(updatedStorageClass?.metadata?.name);
  };

  if (scLoaded && !storageClass) {
    handleStorageClass(defaultSCName);
  }

  const onSubmit = async () => {
    setAllocating(true);
    setSubmitting(true);
    const dvObj = getDataVolume(
      { name: baseImageName, namespace: baseImageNamespace },
      { ...size, accessMode, storageClass },
      { dataSource, url, pvcName, pvcNamespace, pvcSize, container },
    );
    try {
      if (dataSource === DATA_SOURCE.UPLOAD) {
        const { token } = await createUploadPVC(dvObj);
        setAllocating(false);
        uploadData({
          file: file.value,
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

  let valid = scLoaded && !isSubmitting;
  switch (dataSource) {
    case DATA_SOURCE.UPLOAD: {
      valid = valid && !!file?.value;
      break;
    }
    case DATA_SOURCE.CLONE: {
      valid = valid && !!pvcNamespace && !!pvcName;
      break;
    }
    case DATA_SOURCE.URL: {
      valid = valid && !!url;
      break;
    }
    case DATA_SOURCE.REGISTRY: {
      valid = valid && !!container;
      break;
    }
    default:
      valid = false;
  }

  const isUpstream = window.SERVER_FLAGS.branding === 'okd';

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Add source to vendor template</ModalTitle>
      {uploadAllowedLoading ? (
        <LoadingBox />
      ) : uploadAllowed ? (
        <>
          <ModalBody>
            {!isSubmitting && (
              <>
                <div className="kubevirt-modal-desc">
                  This data can be found in{' '}
                  <b>
                    Storage &gt; {PersistentVolumeClaimModel.labelPlural} &gt; {baseImageName}
                  </b>{' '}
                  under the <b>{baseImageNamespace}</b> namespace.
                </div>

                <Form>
                  <FormRow fieldId="form-data-source" title="Data source type" isRequired>
                    <Select
                      placeholderText="--- Select data source ---"
                      aria-label="Select data source"
                      onToggle={setDataSourceOpen}
                      onSelect={(e, value) => {
                        setDataSource(value as string);
                        setDataSourceOpen(false);
                      }}
                      selections={dataSource}
                      isOpen={isDataSourceOpen}
                    >
                      {DATA_SOURCES.map((ds) => (
                        <SelectOption key={ds.value} {...ds} />
                      ))}
                    </Select>
                  </FormRow>
                  {dataSource === DATA_SOURCE.UPLOAD && (
                    <FormRow fieldId="form-ds-file" title="Upload source" isRequired>
                      <FileUpload
                        id="file-upload"
                        value={file?.value}
                        filename={file?.name}
                        onChange={(value: File, name: string) => setFile({ name, value })}
                        hideDefaultPreview
                        isRequired
                      />
                    </FormRow>
                  )}
                  {dataSource === DATA_SOURCE.URL && (
                    <>
                      <FormRow fieldId="form-ds-url" title="Import URL" isRequired>
                        <TextInput
                          value={url}
                          type="text"
                          onChange={setURL}
                          aria-label="import URL"
                        />
                        <div className="pf-c-form__helper-text" aria-live="polite">
                          Example: Visit the{' '}
                          <a
                            href={isUpstream ? FEDORA_IMAGE_LINK : RHEL_IMAGE_LINK}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <strong>{isUpstream ? 'Fedora' : 'RHEL'} cloud image list</strong>
                          </a>{' '}
                          and copy a url for the field above
                        </div>
                      </FormRow>
                    </>
                  )}
                  {dataSource === DATA_SOURCE.REGISTRY && (
                    <>
                      <FormRow fieldId="form-ds-container" title="Import from container" isRequired>
                        <TextInput
                          value={container}
                          type="text"
                          onChange={setContainer}
                          aria-label="import from container"
                        />
                        <div className="pf-c-form__helper-text" aria-live="polite">
                          Example: {EXAMPLE_CONTAINER}
                        </div>
                      </FormRow>
                    </>
                  )}
                  {dataSource === DATA_SOURCE.CLONE && (
                    <>
                      <FormRow
                        fieldId="form-ds-pvc"
                        title={`${PersistentVolumeClaimModel.label} namespace`}
                        isRequired
                      >
                        <ProjectDropdown
                          onChange={(ns) => {
                            setPVCNamespace(ns);
                            setPVCName(undefined);
                          }}
                          project={pvcNamespace}
                          placeholder={PersistentVolumeClaimModel.label}
                        />
                      </FormRow>
                      <PVCSelector
                        setName={setPVCName}
                        namespace={pvcNamespace}
                        setPVCSize={setPVCSize}
                      />
                    </>
                  )}
                  {[DATA_SOURCE.UPLOAD, DATA_SOURCE.URL, DATA_SOURCE.REGISTRY].includes(
                    dataSource,
                  ) && (
                    <FormRow
                      fieldId="form-ds-pvc"
                      title={`${PersistentVolumeClaimModel.label} size`}
                      isRequired
                    >
                      <RequestSizeInput
                        name="requestSize"
                        required
                        onChange={setSize}
                        defaultRequestSizeUnit={size.unit}
                        defaultRequestSizeValue={size.value}
                        dropdownUnits={dropdownUnits}
                        describedBy="request-size-help"
                        inputID="request-size-input"
                        inputClassName="kubevirt-set-size-field"
                      >
                        <div className="pf-c-form__helper-text" aria-live="polite">
                          Ensure your PVC size covers the requirements of the uncompressed image and
                          any other space requirements. More storage can be added later.
                        </div>
                      </RequestSizeInput>
                    </FormRow>
                  )}
                  <ExpandableSection
                    toggleText="Advanced"
                    onToggle={setShowAdvanced}
                    isExpanded={showAdvanced}
                  >
                    <FormRow fieldId="form-sc" title="Storage class" isRequired>
                      <FormSelect
                        value={
                          defaultSCName === storageClass
                            ? `${storageClass} (default)`
                            : storageClass
                        }
                        onChange={handleStorageClass}
                        id="vm-select-sc"
                        name="vm-select-sc"
                        aria-label="Select storage class"
                        isDisabled={!scLoaded}
                      >
                        {storageClasses.map((sc) => (
                          <FormSelectOption
                            key={sc.metadata.uid}
                            value={sc.metadata.uid}
                            label={
                              defaultSCName === sc.metadata.name
                                ? `${sc.metadata.name} (default)`
                                : sc.metadata.name
                            }
                          />
                        ))}
                      </FormSelect>
                      {!scLoaded && <LoadingInline />}
                    </FormRow>
                    <FormRow
                      fieldId="form-access-mode"
                      title="Access mode"
                      isRequired
                      className="kubevirt-add-source-field"
                    >
                      <FormSelect
                        value={accessMode}
                        onChange={setAccessMode}
                        id="vm-select-am"
                        name="vm-select-am"
                        aria-label="Select access mode"
                        isDisabled={!scLoaded}
                      >
                        {accessModes.map((am) => (
                          <FormSelectOption
                            key={am}
                            value={am}
                            label={accessModeRadios.find(({ value }) => value === am)?.title || am}
                          />
                        ))}
                      </FormSelect>
                      {!scLoaded && <LoadingInline />}
                    </FormRow>
                  </ExpandableSection>
                </Form>
              </>
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
                isDisabled={!valid}
                data-test="confirm-action"
                id="confirm-action"
                onClick={onSubmit}
              >
                {`Save and ${DATA_SOURCES.find((ds) => ds.value === dataSource).action}`}
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
