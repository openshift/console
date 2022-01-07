import * as React from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Checkbox,
  FileUpload,
  FormSelect,
  FormSelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import axios from 'axios';
import cx from 'classnames';
import { TFunction } from 'i18next';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { dropdownUnits, initialAccessModes } from '@console/internal/components/storage/shared';
import {
  ButtonBar,
  ExternalLink,
  history,
  LoadingInline,
  RequestSizeInput,
  ResourceLink,
  resourcePath,
  useAccessReview2,
  useMultipleAccessReviews,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  PersistentVolumeClaimModel,
  StorageClassModel,
  TemplateModel,
} from '@console/internal/models';
import {
  ConfigMapKind,
  K8sResourceKind,
  K8sVerb,
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import {
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_VM_COMMON_NAMESPACE,
} from '../../../constants';
import { LABEL_CDROM_SOURCE } from '../../../constants/vm/constants';
import { useStorageClassConfigMap } from '../../../hooks/storage-class-config-map';
import { useBaseImages } from '../../../hooks/use-base-images';
import { useStorageProfileSettings } from '../../../hooks/use-storage-profile-settings';
import {
  createUploadPVC,
  PVCInitError,
} from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import { DataVolumeModel } from '../../../models';
import { getKubevirtModelAvailableAPIVersion } from '../../../models/kubevirtReferenceForModel';
import { getDefaultStorageClass } from '../../../selectors/config-map/sc-defaults';
import { getName, getNamespace, getParameterValue } from '../../../selectors/selectors';
import { getTemplateOperatingSystems } from '../../../selectors/vm-template/advanced';
import { OperatingSystemRecord } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';
import { AccessModeSelector } from '../../AccessMode/AccessModeSelector';
import { FormSelectPlaceholderOption } from '../../form/form-select-placeholder-option';
import { BinaryUnit } from '../../form/size-unit-utils';
import { VolumeModeSelector } from '../../VolumeMode/VolumeModeSelector';
import { CDIUploadContext } from '../cdi-upload-provider';
import {
  CDI_UPLOAD_OS_URL_PARAM,
  CDI_UPLOAD_SUPPORTED_TYPES_URL,
  CDI_UPLOAD_URL_BUILDER,
} from '../consts';
import { uploadErrorType, UploadPVCFormStatus } from './upload-pvc-form-status';
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

export const uploadErrorMessage = (t: TFunction) => ({
  [uploadErrorType.MISSING]: t('kubevirt-plugin~File input is missing'),
  [uploadErrorType.ALLOCATE]: t('kubevirt-plugin~Could not create persistent volume claim'),
  [uploadErrorType.CERT]: (uploadProxy) => (
    <Trans ns="kubevirt-plugin" t={t}>
      It seems that your browser does not trust the certificate of the upload proxy. Please{' '}
      <a href={`https://${uploadProxy}`} rel="noopener noreferrer" target="_blank">
        approve this certificate
      </a>{' '}
      and try again
    </Trans>
  ),
});

export const getGiBUploadPVCSizeByImage = (sizeInBytes: number) => {
  const sizeGi = sizeInBytes / 1024 / 1024 / 1024;

  if (sizeGi < 0.5) return 1;
  return Math.ceil(sizeGi) * 2;
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
  scConfigMap,
  storageClasses,
  ...props
}) => {
  const { t } = useTranslation();
  const operatingSystems = getTemplateOperatingSystems(commonTemplates);
  const operatingSystemHaveDV = operatingSystems.find(
    (os) => os?.baseImageName && os?.baseImageNamespace,
  );
  const [storageClassName, setStorageClassName] = React.useState('');
  const [pvcName, setPvcName] = React.useState('');
  const [namespace, setNamespace] = React.useState(props.namespace);
  const [accessMode, setAccessMode] = React.useState('');
  const [volumeMode, setVolumeMode] = React.useState('');
  const [requestSizeValue, setRequestSizeValue] = React.useState('');
  const [requestSizeUnit, setRequestSizeUnit] = React.useState('Gi');
  const [isGolden, setIsGolden] = React.useState(!!osParam);
  const [os, setOs] = React.useState<OperatingSystemRecord>();
  const [pvcSizeFromTemplate, setPvcSizeFromTemplate] = React.useState<boolean>(false);
  const [mountAsCDROM, setMountAsCDROM] = React.useState<boolean>();
  const [osImageExists, setOsImageExists] = React.useState(false);
  const defaultSCName = getDefaultStorageClass(storageClasses)?.metadata.name;
  const updatedStorageClass = storageClasses?.find((sc) => sc.metadata.name === storageClassName);
  const provisioner = updatedStorageClass?.provisioner || '';
  const [applySP, setApplySP] = React.useState<boolean>(true);
  const [
    spAccessMode,
    spVolumeMode,
    spLoaded,
    isSPSettingProvided,
    loadError,
  ] = useStorageProfileSettings(storageClassName || defaultSCName);

  React.useEffect(() => {
    if (!storageClassName) {
      if (defaultSCName) {
        setStorageClassName(defaultSCName);
      } else {
        setStorageClassName(storageClasses?.[0]?.metadata?.name);
      }
    }
  }, [defaultSCName, storageClassName, storageClasses]);

  React.useEffect(() => {
    const value = getGiBUploadPVCSizeByImage((fileValue as File)?.size);
    const isIso = (fileValue as File)?.name?.toLowerCase().endsWith('.iso');
    setMountAsCDROM(isIso);
    setPvcSizeFromTemplate(!isIso);
    setRequestSizeValue(isIso ? value?.toString() : os?.baseImageRecomendedSize[0] || '');
    setRequestSizeUnit(os?.baseImageRecomendedSize[1] || BinaryUnit.Gi);
  }, [fileValue, os]);

  React.useEffect(() => {
    if (storageClassName && spLoaded && applySP && isSPSettingProvided) {
      if (spAccessMode.getValue() !== accessMode) {
        setAccessMode(spAccessMode.getValue());
      }

      if (spVolumeMode.getValue() !== volumeMode) {
        setVolumeMode(spVolumeMode.getValue());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spLoaded, spAccessMode, spVolumeMode, storageClassName]);

  React.useEffect(() => {
    const updateDV = (): K8sResourceKind => {
      const obj: K8sResourceKind = {
        apiVersion: getKubevirtModelAvailableAPIVersion(DataVolumeModel),
        kind: DataVolumeModel.kind,
        metadata: {
          name: pvcName,
          namespace,
          labels: {
            [LABEL_CDROM_SOURCE]: mountAsCDROM?.toString(),
          },
        },
        spec: {
          source: {
            upload: {},
          },
          pvc: {
            storageClassName,
            accessModes: [accessMode],
            volumeMode,
            resources: {
              requests: {
                storage: `${requestSizeValue}${requestSizeUnit}`,
              },
            },
          },
        },
      };

      return obj;
    };
    onChange(updateDV);
  }, [
    accessMode,
    volumeMode,
    namespace,
    pvcName,
    onChange,
    mountAsCDROM,
    storageClassName,
    requestSizeValue,
    requestSizeUnit,
  ]);

  const handleRequestSizeInputChange = (obj) => {
    setRequestSizeValue(obj.value);
    setRequestSizeUnit(obj.unit);
  };

  const handlePvcName: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setPvcName(event.currentTarget.value);
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

  const handlePvcSizeTemplate = (checked: boolean) => {
    setPvcSizeFromTemplate(checked);
    setRequestSizeValue(
      checked
        ? os?.baseImageRecomendedSize[0] || ''
        : getGiBUploadPVCSizeByImage((fileValue as File)?.size)?.toString(),
    );
  };

  const handleCDROMChange = (checked: boolean) => {
    setMountAsCDROM(checked);
  };

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
        <Alert title={t('kubevirt-plugin~Persistent volume creation')} variant="info" isInline>
          {t(
            'kubevirt-plugin~This Persistent Volume Claim will be created using a DataVolume through Containerized Data Importer (CDI)',
          )}
        </Alert>
      </div>
      <label className="control-label co-required" htmlFor="file-upload">
        {t('kubevirt-plugin~Upload Data')}
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
        {operatingSystemHaveDV && (
          <Checkbox
            id="golden-os-switch"
            className="kv--create-upload__golden-switch"
            label={t('kubevirt-plugin~Attach this data to a Virtual Machine operating system')}
            isChecked={isGolden}
            data-checked-state={isGolden}
            onChange={handleGoldenCheckbox}
            isDisabled={isLoading}
          />
        )}
      </div>
      {isGolden && (
        <>
          <label className="control-label co-required" htmlFor="golden-os">
            {t('kubevirt-plugin~Operating System')}
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
                placeholder={t('kubevirt-plugin~--- Pick an Operating system ---')}
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
                    label={t('kubevirt-plugin~{{nameOrId}} - Default data image already exists', {
                      nameOrId: name || id,
                    })}
                  />
                ) : !baseImageName ? (
                  <FormSelectOption
                    isDisabled
                    key={id}
                    value={id}
                    label={t(
                      'kubevirt-plugin~{{nameOrId}} - Template missing data image definition',
                      { nameOrId: name || id },
                    )}
                  />
                ) : (
                  <FormSelectOption key={id} value={id} label={name || id} />
                ),
              )}
            </FormSelect>
            {os && (
              <>
                <Checkbox
                  id="golden-os-checkbox-pvc-size-template"
                  className="kv--create-upload__golden-switch"
                  isChecked={pvcSizeFromTemplate}
                  data-checked-state={pvcSizeFromTemplate}
                  label={t('kubevirt-plugin~Use template size PVC')}
                  onChange={handlePvcSizeTemplate}
                />
                <Checkbox
                  id="golden-os-checkbox-cdrom-boot-source-template"
                  className="kv--create-upload__golden-switch"
                  isChecked={!!mountAsCDROM}
                  data-checked-state={!!mountAsCDROM}
                  label={t('kubevirt-plugin~This is a CD-ROM boot source')}
                  onChange={handleCDROMChange}
                />
              </>
            )}
          </div>
          {osImageExists && (
            <div className="form-group">
              <Alert
                isInline
                variant="danger"
                title={t('kubevirt-plugin~Operating system source already defined')}
              >
                {t(
                  'kubevirt-plugin~In order to add a new source for {{osName}} you will need to delete the following PVC:',
                  { osName: os?.name },
                )}{' '}
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
            {t('kubevirt-plugin~Namespace')}
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
              {t('kubevirt-plugin~A unique namespace for the storage claim within the project')}
            </p>
          </div>
        </>
      )}
      <label className="control-label co-required" htmlFor="pvc-name">
        {t('kubevirt-plugin~Persistent Volume Claim Name')}
      </label>
      <div className="form-group">
        <input
          disabled={isGolden || isLoading}
          className="pf-c-form-control"
          type="text"
          onChange={handlePvcName}
          placeholder={
            isGolden
              ? t('kubevirt-plugin~pick an operating system')
              : t('kubevirt-plugin~my-storage-claim')
          }
          aria-describedby="pvc-name-help"
          id="pvc-name"
          value={pvcName || ''}
          required
        />
        <p className="help-block" id="pvc-name-help">
          {t('kubevirt-plugin~A unique name for the storage claim within the project')}
        </p>
      </div>
      <div className="form-group">
        <Split hasGutter>
          <SplitItem className="kv--create-upload__flexitem">
            <Stack hasGutter>
              <StackItem>
                <StorageClassDropdown
                  name={t('kubevirt-plugin~Storage class')}
                  onChange={(sc) => setStorageClassName(sc?.metadata?.name)}
                  data-test="storage-class-dropdown"
                />
              </StackItem>
              <StackItem>
                <Checkbox
                  id="apply-storage-provider"
                  description={t(
                    'kubevirt-plugin~Use optimized access mode & volume mode settings from StorageProfile resource.',
                  )}
                  isChecked={applySP}
                  data-checked-state={applySP}
                  onChange={() => setApplySP(!applySP)}
                  isDisabled={!isSPSettingProvided}
                  label={t('kubevirt-plugin~Apply optimized StorageProfile settings')}
                  data-test="apply-storage-provider"
                />
              </StackItem>
            </Stack>
          </SplitItem>
          <SplitItem className="kv--create-upload__flexitem">
            <label className="control-label co-required" htmlFor="request-size-input">
              {t('kubevirt-plugin~Size')}
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
              {t(
                'kubevirt-plugin~Ensure your PVC size covers the requirements of the uncompressed image and any other space requirements.',
              )}
            </p>
          </SplitItem>
        </Split>
      </div>
      {!spLoaded && !loadError ? (
        <LoadingInline />
      ) : applySP && isSPSettingProvided ? (
        <div className="form-group" data-test="sp-default-settings">
          {t('kubevirt-plugin~Access mode: {{accessMode}} / Volume mode: {{volumeMode}}', {
            accessMode: spAccessMode?.getValue(),
            volumeMode: spVolumeMode?.getValue(),
          })}
        </div>
      ) : (
        <div data-test="sp-no-default-settings">
          <div className="form-group">
            <AccessModeSelector
              onChange={(aMode) => setAccessMode(aMode)}
              provisioner={provisioner}
              loaded
              availableAccessModes={initialAccessModes}
              initialAccessMode={
                isSPSettingProvided && storageClassName ? spAccessMode?.getValue() : undefined
              }
            />
          </div>
          <div className="form-group">
            <VolumeModeSelector
              onChange={(vMode) => setVolumeMode(vMode)}
              provisioner={provisioner}
              accessMode={accessMode}
              storageClass={storageClassName}
              loaded
              initialVolumeMode={
                isSPSettingProvided && storageClassName ? spVolumeMode?.getValue() : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const UploadPVCPage: React.FC<UploadPVCPageProps> = (props) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingCertificate, setCheckingCertificate] = React.useState(false);
  const [disableFormSubmit, setDisableFormSubmit] = React.useState(false);
  const [fileValue, setFileValue] = React.useState<File>(null);
  const [fileName, setFileName] = React.useState('');
  const [fileNameExtension, setFileNameExtension] = React.useState('');
  const [isFileRejected, setIsFileRejected] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [isAllocating, setIsAllocating] = React.useState(false);
  const [dvObj, setDvObj] = React.useState<V1alpha1DataVolume>(null);
  const [commonTemplates, loadedTemplates, errorTemplates] = useK8sWatchResource<TemplateKind[]>(
    templatesResource,
  );

  const goldenNamespacesResources = React.useMemo(() => {
    const goldenNamespaces = [
      ...new Set(
        (commonTemplates || [])
          .map((template) => getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER))
          .filter((ns) => !!ns),
      ),
    ];

    return goldenNamespaces.map((ns) => ({
      group: DataVolumeModel.apiGroup,
      resource: DataVolumeModel.plural,
      verb: 'create' as K8sVerb,
      namespace: ns,
    }));
  }, [commonTemplates]);

  const [goldenAccessReviews, rbacLoading] = useMultipleAccessReviews(goldenNamespacesResources);
  const allowedTemplates = commonTemplates.filter((tmp) =>
    goldenAccessReviews.some(
      (accessReview) =>
        accessReview.allowed &&
        accessReview.resourceAttributes.namespace ===
          getParameterValue(tmp, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER),
    ),
  );

  const [goldenPvcs, loadedPvcs, errorPvcs] = useBaseImages(allowedTemplates);
  const { uploads, uploadData, uploadProxyURL } = React.useContext(CDIUploadContext);
  const [scConfigMap, cmLoaded] = useStorageClassConfigMap();
  const [scAllowed, scAllowedLoading] = useAccessReview2({
    group: StorageClassModel.apiGroup,
    resource: StorageClassModel.plural,
    verb: 'list',
  });
  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>(
    scAllowed
      ? {
          kind: StorageClassModel.kind,
          isList: true,
          namespaced: false,
        }
      : null,
  );

  const initialNamespace = props?.match?.params?.ns;
  const namespace = getNamespace(dvObj) || initialNamespace;
  const urlParams = new URLSearchParams(window.location.search);
  const osParam = urlParams.get(CDI_UPLOAD_OS_URL_PARAM);
  const title = t('kubevirt-plugin~Upload Data to Persistent Volume Claim');
  const fileNameExtText = fileNameExtension
    ? t('kubevirt-plugin~detected file extension is {{fileNameExtension}}', { fileNameExtension })
    : t('kubevirt-plugin~no file extention detected');

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    if (!fileName) {
      setError(uploadErrorType.MISSING);
    } else {
      // checking valid certificate for proxy
      setCheckingCertificate(true);
      axios
        .get(CDI_UPLOAD_URL_BUILDER(uploadProxyURL))
        .catch((catchError) => {
          setCheckingCertificate(false);
          // the GET request will return an error everytime, but it will be undefined only if the certificate is invalid.
          if (catchError?.response === undefined) {
            throw new Error(uploadErrorType.CERT);
          }
        })
        .then(() => {
          setError('');
          setIsAllocating(true);
          setIsSubmitting(true);
          return createUploadPVC(dvObj);
        })
        .then(({ token }) => {
          setIsAllocating(false);
          uploadData({
            file: fileValue,
            token,
            pvcName: getName(dvObj),
            namespace,
          });
        })
        .catch((err) => {
          setIsAllocating(false);
          err instanceof PVCInitError
            ? setError(uploadErrorType.CDI_INIT)
            : setError(err?.message || uploadErrorType.ALLOCATE);
        });
    }
  };

  const handleFileChange = (value, filename) => {
    setFileName(filename);
    setFileValue(value);

    setFileNameExtension(/[.][^.]+$/.exec(filename)?.toString());
    setIsFileRejected(false);
    setError('');
  };

  React.useEffect(() => {
    if (errorTemplates || errorPvcs) {
      setError(errorTemplates?.message || errorPvcs?.message);
    }
  }, [errorTemplates, errorPvcs]);

  const errorMessage =
    error === uploadErrorType.CERT
      ? uploadErrorMessage(t)[uploadErrorType.CERT](uploadProxyURL)
      : uploadErrorMessage(t)[error] || error;

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
            commonTemplates={allowedTemplates}
            goldenPvcs={goldenPvcs}
            osParam={osParam}
            isLoading={!loadedTemplates}
            setDisableFormSubmit={setDisableFormSubmit}
            scConfigMap={scConfigMap}
            storageClasses={storageClasses}
          />
          <ButtonBar
            inProgress={
              rbacLoading ||
              scAllowedLoading ||
              !scLoaded ||
              !cmLoaded ||
              !loadedTemplates ||
              !loadedPvcs ||
              isCheckingCertificate
            }
            errorMessage={errorMessage}
          >
            {isFileRejected && (
              <Alert variant="warning" isInline title={t('kubevirt-plugin~File type extension')}>
                <p>
                  {t(
                    'kubevirt-plugin~Based on the file extension it seems like you are trying to upload a file which is not supported ({{fileNameExtText}}).',
                    { fileNameExtText },
                  )}
                </p>
                <p>
                  <ExternalLink
                    text={t('kubevirt-plugin~Learn more about supported formats')}
                    href={CDI_UPLOAD_SUPPORTED_TYPES_URL}
                  />
                </p>
              </Alert>
            )}
            <ActionGroup className="pf-c-form">
              <Button
                isDisabled={disableFormSubmit || isCheckingCertificate}
                id="save-changes"
                type="submit"
                variant="primary"
              >
                {t('kubevirt-plugin~Upload')}
              </Button>
              <Button onClick={history.goBack} type="button" variant="secondary">
                {t('kubevirt-plugin~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
      <UploadPVCFormStatus
        upload={uploads.find(
          (upl) => upl.pvcName === getName(dvObj) && upl.namespace === namespace,
        )}
        dataVolume={dvObj}
        isSubmitting={isSubmitting}
        isAllocating={isAllocating}
        allocateError={error}
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
  scConfigMap: ConfigMapKind;
  storageClasses: StorageClassResourceKind[];
  onChange: (K8sResourceKind) => void;
  handleFileChange: (value, filename, event) => void;
};

export type UploadPVCPageProps = {
  match: match<{ ns?: string }>;
};
