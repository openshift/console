import * as _ from 'lodash';
import * as React from 'react';
import cx from 'classnames';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';
import {
  FileUpload,
  ActionGroup,
  Alert,
  Button,
  Checkbox,
  FormSelect,
  FormSelectOption,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { isCephProvisioner, isObjectSC } from '@console/shared/src/utils';
import {
  K8sResourceKind,
  apiVersionForModel,
  TemplateKind,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import {
  ButtonBar,
  RequestSizeInput,
  history,
  resourcePath,
  ExternalLink,
  ResourceLink,
} from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { RadioInput } from '@console/internal/components/radio';
import { StorageClass } from '@console/internal/components/storage-class-form';
import {
  cephRBDProvisionerSuffix,
  provisionerAccessModeMapping,
  initialAccessModes,
  accessModeRadios,
  dropdownUnits,
  getAccessModeForProvisioner,
} from '@console/internal/components/storage/shared';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useBaseImages } from '../../../hooks/use-base-images';
import { DataVolumeModel } from '../../../models';
import { createUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import { CDIUploadContext } from '../cdi-upload-provider';
import { UploadPVCFormStatus } from './upload-pvc-form-status';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import { getName, getNamespace } from '@console/shared';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { getTemplateOperatingSystems } from '../../../selectors/vm-template/advanced';
import { FormSelectPlaceholderOption } from '../../form/form-select-placeholder-option';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_VM_COMMON_NAMESPACE,
} from '../../../constants';
import { CDI_UPLOAD_OS_URL_PARAM, CDI_UPLOAD_SUPPORTED_TYPES_URL } from '../consts';
import { OperatingSystemRecord } from '../../../types';

import './upload-pvc-form.scss';

const templatesResource: WatchK8sResource = {
  isList: true,
  optional: true,
  kind: TemplateModel.kind,
  namespace: TEMPLATE_VM_COMMON_NAMESPACE,
  selector: {
    matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
  },
};

const uploadErrorType = {
  MISSING: 'missing',
  ALLOCATE: 'allocate',
  TYPE: 'type',
};

const uploadErrorMessage = {
  [uploadErrorType.MISSING]: 'File input is missing',
  [uploadErrorType.ALLOCATE]: 'Could not create persistent volume claim',
  [uploadErrorType.TYPE]: (
    <>
      <p>
        The format of the file you are uploading is not supported. Please use one of the supported
        formats
      </p>
      <p>
        <ExternalLink
          text="Learn more about supported formats"
          href={CDI_UPLOAD_SUPPORTED_TYPES_URL}
        />
      </p>
    </>
  ),
};

export const UploadPVCForm: React.FC<UploadPVCFormProps> = ({
  onChange,
  fileName,
  handleFileChange,
  fileValue,
  commonTemplates,
  goldenPvcs,
  osParam,
  isLoading,
  setIsFileRejected,
  setDisableFormSubmit,
  ...props
}) => {
  const operatingSystems = getTemplateOperatingSystems(commonTemplates);
  const [accessModeHelp, setAccessModeHelp] = React.useState('Permissions to the mounted drive.');
  const [allowedAccessModes, setAllowedAccessModes] = React.useState(initialAccessModes);
  const [storageClass, setStorageClass] = React.useState('');
  const [pvcName, setPvcName] = React.useState('');
  const [namespace, setNamespace] = React.useState(props.namespace);
  const [accessMode, setAccessMode] = React.useState('ReadWriteOnce');
  const [requestSizeValue, setRequestSizeValue] = React.useState('');
  const [requestSizeUnit, setRequestSizeUnit] = React.useState('Gi');
  const [storageProvisioner, setStorageProvisioner] = React.useState('');
  const [isGolden, setIsGolden] = React.useState(!!osParam);
  const [os, setOs] = React.useState<OperatingSystemRecord>();
  const [osImageExists, setOsImageExists] = React.useState(false);

  React.useEffect(() => {
    const updateDV = (): K8sResourceKind => {
      const obj: K8sResourceKind = {
        apiVersion: apiVersionForModel(DataVolumeModel),
        kind: DataVolumeModel.kind,
        metadata: {
          name: pvcName,
          namespace,
        },
        spec: {
          source: {
            upload: {},
          },
          pvc: {
            accessModes: [accessMode],
            resources: {
              requests: {
                storage: `${requestSizeValue}${requestSizeUnit}`,
              },
            },
          },
        },
      };

      if (storageClass) {
        obj.spec.pvc.storageClassName = storageClass;

        // should set block only for RBD + RWX
        if (
          _.endsWith(storageProvisioner, cephRBDProvisionerSuffix) &&
          accessMode === 'ReadWriteMany'
        ) {
          obj.spec.volumeMode = 'Block';
        }
      }

      return obj;
    };
    onChange(updateDV);
  }, [
    accessMode,
    namespace,
    pvcName,
    onChange,
    storageClass,
    requestSizeValue,
    requestSizeUnit,
    storageProvisioner,
  ]);

  const handleStorageClass = (updatedStorageClass) => {
    const provisioner: string = updatedStorageClass?.provisioner || '';
    // if the provisioner is unknown or no storage class selected, user should be able to set any access mode
    const modes = provisionerAccessModeMapping[provisioner]
      ? provisionerAccessModeMapping[provisioner]
      : getAccessModeForProvisioner(provisioner);
    // setting message to display for various modes when a storage class of a know provisioner is selected
    const displayMessage =
      provisionerAccessModeMapping[provisioner] || isCephProvisioner(provisioner)
        ? 'Access mode is set by storage class and cannot be changed'
        : 'Permissions to the mounted drive';
    setAccessMode('ReadWriteOnce');
    setAccessModeHelp(displayMessage);
    // setting accessMode to default with the change to Storage Class selection
    setAllowedAccessModes(modes);
    setStorageClass(updatedStorageClass?.metadata?.name);
    setStorageProvisioner(provisioner);
  };

  const handleRequestSizeInputChange = (obj) => {
    setRequestSizeValue(obj.value);
    setRequestSizeUnit(obj.unit);
  };

  const handlePvcName: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setPvcName(event.currentTarget.value);
  };

  const handleAccessMode: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setAccessMode(event.currentTarget.value);
  };

  const handleGoldenCheckbox = (checked) => {
    setIsGolden(checked);
    if (checked) {
      setNamespace(os?.baseImageNamespace);
      if (pvcName && !os) {
        setPvcName('');
      } else {
        setPvcName(os?.baseImageName);
      }
    }
    if (!checked) {
      setNamespace(props.namespace);
    }
  };

  const handleOs = (newOs: string) => {
    const operatingSystem = operatingSystems.find((o) => o.id === newOs);
    setOs(operatingSystem);
    setPvcName(operatingSystem?.baseImageName);
    if (operatingSystem?.baseImageNamespace) {
      setNamespace(operatingSystem.baseImageNamespace);
    }
  };

  const onlyPvcSCs = React.useCallback((sc: StorageClass) => !isObjectSC(sc), []);

  React.useEffect(() => {
    if (!isLoading && osParam) {
      handleOs(osParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  React.useEffect(() => {
    const goldenImagePVC = goldenPvcs?.find(
      (pvc) => getName(pvc) === os?.baseImageName && getNamespace(pvc) === os?.baseImageNamespace,
    );
    if (goldenImagePVC) {
      setOsImageExists(true);
      setDisableFormSubmit(true);
    } else if (osImageExists) {
      setOsImageExists(false);
      setDisableFormSubmit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goldenPvcs, os]);

  return (
    <div>
      <div className="form-group">
        <Alert title="Persistent volume creation" variant="info" isInline>
          This Persistent Volume Claim will be created using a DataVolume through Containerized Data
          Importer (CDI)
        </Alert>
      </div>
      <label className="control-label co-required" htmlFor="file-upload">
        Upload Data
      </label>
      <div className="form-group">
        <FileUpload
          id="file-upload"
          value={fileValue}
          filename={fileName}
          onChange={handleFileChange}
          hideDefaultPreview
          isRequired
          isDisabled={isLoading}
          dropzoneProps={{
            accept: '.iso,.img,.qcow2,.gz,.xz',
            onDropRejected: () => setIsFileRejected(true),
            onDropAccepted: () => setIsFileRejected(false),
          }}
        />
        <Checkbox
          id="golden-os-switch"
          className="kv--create-upload__golden-switch"
          label="Attach this data to a Virtual Machine operating system"
          isChecked={isGolden}
          onChange={handleGoldenCheckbox}
          isDisabled={isLoading}
        />
      </div>
      {isGolden && (
        <>
          <label className="control-label co-required" htmlFor="golden-os">
            Operating System
          </label>
          <div className="form-group">
            <FormSelect
              id="golden-os-select"
              isDisabled={isLoading}
              onChange={handleOs}
              value={os?.id || ''}
              isRequired
            >
              <FormSelectPlaceholderOption
                placeholder="--- Pick an Operating system ---"
                isDisabled={!!os}
              />
              {operatingSystems.map(({ id, name, baseImageName, baseImageNamespace }) =>
                goldenPvcs?.find(
                  (pvc) =>
                    getName(pvc) === baseImageName && getNamespace(pvc) === baseImageNamespace,
                ) ? (
                  <FormSelectOption
                    key={id}
                    value={id}
                    label={`${name || id} - Default data image already exists`}
                  />
                ) : !baseImageName ? (
                  <FormSelectOption
                    isDisabled
                    key={id}
                    value={id}
                    label={`${name || id} - Template missing data image definition`}
                  />
                ) : (
                  <FormSelectOption key={id} value={id} label={name || id} />
                ),
              )}
            </FormSelect>
          </div>
          {osImageExists && (
            <div className="form-group">
              <Alert isInline variant="danger" title="Operating system source already defined">
                In order to add a new source for {os?.name} you will need to delete the following
                PVC:{' '}
                <ResourceLink
                  hideIcon
                  inline
                  kind={PersistentVolumeClaimModel.kind}
                  name={os?.baseImageName}
                  namespace={os?.baseImageNamespace}
                />
              </Alert>
            </div>
          )}
          <label className="control-label co-required" htmlFor="pvc-namespace">
            Namespace
          </label>
          <div className="form-group">
            <input
              disabled
              className="pf-c-form-control"
              type="text"
              aria-describedby="pvc-namespace-help"
              id="pvc-namespace"
              value={namespace || ''}
              required
            />
            <p className="help-block" id="pvc-namespace-help">
              A unique namespace for the storage claim within the project
            </p>
          </div>
        </>
      )}
      <label className="control-label co-required" htmlFor="pvc-name">
        Persistent Volume Claim Name
      </label>
      <div className="form-group">
        <input
          disabled={isGolden || isLoading}
          className="pf-c-form-control"
          type="text"
          onChange={handlePvcName}
          placeholder={isGolden ? 'pick an operating system' : 'my-storage-claim'}
          aria-describedby="pvc-name-help"
          id="pvc-name"
          value={pvcName || ''}
          required
        />
        <p className="help-block" id="pvc-name-help">
          A unique name for the storage claim within the project
        </p>
      </div>
      <div className="form-group">
        <Split hasGutter>
          <SplitItem className="kv--create-upload__flexitem">
            <StorageClassDropdown
              isDisabled={isLoading}
              onChange={handleStorageClass}
              id="storageclass-dropdown"
              describedBy="storageclass-dropdown-help"
              required={false}
              name="storageClass"
              filter={onlyPvcSCs}
            />
          </SplitItem>
          <SplitItem className="kv--create-upload__flexitem">
            <label className="control-label co-required" htmlFor="request-size-input">
              Size
            </label>
            <RequestSizeInput
              name="requestSize"
              required
              onChange={handleRequestSizeInputChange}
              defaultRequestSizeUnit={requestSizeUnit}
              defaultRequestSizeValue={requestSizeValue}
              dropdownUnits={dropdownUnits}
              describedBy="request-size-help"
              inputID="request-size-input"
            />
            <p className="help-block" id="request-size-help">
              Ensure your PVC size covers the requirements of the uncompressed image and any other
              space requirements.
            </p>
          </SplitItem>
        </Split>
      </div>
      <label className="control-label co-required" htmlFor="access-mode">
        Access Mode
      </label>
      <div className="form-group">
        {accessModeRadios.map((radio) => {
          let radioObj = null;
          const disabled = !allowedAccessModes.includes(radio.value);

          allowedAccessModes.forEach((mode) => {
            const checked = !disabled ? radio.value === accessMode : radio.value === mode;
            radioObj = (
              <RadioInput
                {...radio}
                key={radio.value}
                onChange={handleAccessMode}
                inline
                disabled={disabled}
                checked={checked}
                aria-describedby="access-mode-help"
                name="accessMode"
              />
            );
          });

          return radioObj;
        })}
        <p className="help-block" id="access-mode-help">
          {accessModeHelp}
        </p>
      </div>
    </div>
  );
};

export const UploadPVCPage: React.FC<UploadPVCPageProps> = (props) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [disableFormSubmit, setDisableFormSubmit] = React.useState(false);
  const [fileValue, setFileValue] = React.useState<File>(null);
  const [fileName, setFileName] = React.useState('');
  const [isFileRejected, setIsFileRejected] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [isAllocating, setIsAllocating] = React.useState(false);
  const [dvObj, setDvObj] = React.useState<V1alpha1DataVolume>(null);
  const [commonTemplates, loadedTemplates, errorTemplates] = useK8sWatchResource<TemplateKind[]>(
    templatesResource,
  );
  const [goldenPvcs, loadedPvcs, errorPvcs] = useBaseImages(commonTemplates);
  const { uploads, uploadData } = React.useContext(CDIUploadContext);
  const initialNamespace = props?.match?.params?.ns;
  const namespace = getNamespace(dvObj) || initialNamespace;
  const urlParams = new URLSearchParams(window.location.search);
  const osParam = urlParams.get(CDI_UPLOAD_OS_URL_PARAM);
  const title = 'Upload Data to Persistent Volume Claim';

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    if (!fileName) {
      setError(uploadErrorType.MISSING);
    } else if (isFileRejected) {
      setError(uploadErrorType.TYPE);
    } else {
      setError('');
      setIsAllocating(true);
      setIsSubmitting(true);
      createUploadPVC(dvObj)
        .then(({ token }) => {
          setIsAllocating(false);
          uploadData({
            file: fileValue,
            token,
            pvcName: getName(dvObj),
            namespace,
          });
        })
        .catch(({ message }: { message: string }) => {
          setIsAllocating(false);
          setError(message || uploadErrorType.ALLOCATE);
        });
    }
  };

  const handleFileChange = (value, filename) => {
    setFileName(filename);
    setFileValue(value);
    setError('');
  };

  React.useEffect(() => {
    if (errorTemplates || errorPvcs) {
      setError(errorTemplates?.message || errorPvcs?.message);
    }
  }, [errorTemplates, errorPvcs]);

  const errorMessage = uploadErrorMessage[error] || error;

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div
        className={cx('co-m-pane__body co-m-pane__form', {
          'kv--create-upload__hide': isSubmitting,
        })}
      >
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{title}</div>
        </h1>
        <form className="co-m-pane__body-group" onSubmit={save}>
          <UploadPVCForm
            onChange={setDvObj}
            namespace={initialNamespace}
            fileValue={fileValue}
            fileName={fileName}
            handleFileChange={handleFileChange}
            setIsFileRejected={setIsFileRejected}
            commonTemplates={commonTemplates}
            goldenPvcs={goldenPvcs}
            osParam={osParam}
            isLoading={!loadedTemplates}
            setDisableFormSubmit={setDisableFormSubmit}
          />
          <ButtonBar inProgress={!loadedTemplates || !loadedPvcs} errorMessage={errorMessage}>
            <ActionGroup className="pf-c-form">
              <Button
                isDisabled={disableFormSubmit}
                id="save-changes"
                type="submit"
                variant="primary"
              >
                Upload
              </Button>
              <Button onClick={history.goBack} type="button" variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
      <UploadPVCFormStatus
        upload={uploads.find(
          (upl) => upl.pvcName === getName(dvObj) && upl.namespace === namespace,
        )}
        isSubmitting={isSubmitting}
        isAllocating={isAllocating}
        allocateError={errorMessage}
        onErrorClick={() => {
          setIsSubmitting(false);
          setError('');
        }}
        onSuccessClick={() =>
          history.push(resourcePath(PersistentVolumeClaimModel.kind, getName(dvObj), namespace))
        }
        onCancelClick={() => history.push(resourcePath(PersistentVolumeClaimModel.kind))}
      />
    </>
  );
};

export type UploadPVCFormProps = {
  namespace: string;
  fileValue: string | File;
  fileName: string;
  osParam?: string;
  isLoading: boolean;
  setDisableFormSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  commonTemplates: TemplateKind[];
  goldenPvcs: PersistentVolumeClaimKind[];
  setIsFileRejected: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (K8sResourceKind) => void;
  handleFileChange: (value, filename, event) => void;
};

export type UploadPVCPageProps = {
  match: match<{ ns?: string }>;
};
