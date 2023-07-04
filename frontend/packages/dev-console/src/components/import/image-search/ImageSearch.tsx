import * as React from 'react';
import {
  TextInputTypes,
  Alert,
  AlertActionCloseButton,
  Button,
  ValidatedOptions,
} from '@patternfly/react-core';
import { useFormikContext, FormikValues, FormikTouched } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { SecretTypeAbstraction } from '@console/internal/components/secrets/create-secret';
import { ImageStreamImportsModel } from '@console/internal/models';
import { k8sCreate, ContainerPort } from '@console/internal/module/k8s';
import { InputField, useDebounceCallback, CheckboxField } from '@console/shared';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { isContainerImportSource } from '../../../types/samples';
import { getSuggestedName, getPorts, makePortName } from '../../../utils/imagestream-utils';
import { getContainerImportSample, getSample } from '../../../utils/samples';
import { secretModalLauncher } from '../CreateSecretModal';
import './ImageSearch.scss';

const useQueryParametersIfDefined = (handleSearch: (image: string) => void) => {
  const { setFieldValue } = useFormikContext<FormikValues>();

  /**
   * Automatically prefill the container image search field into the Formik values
   * and trigger a `ImageStreamImport` via `handleSearch`.
   *
   * 1. Use optional `image` query parameter to prefill the form immediately and
   *    trigger a image search.
   * 2. Use `sample` query parameter to lookup a ConsoleSample.
   *    1. Lookup for the image if the image query parameter was missed.
   *    2. Set other form attributes like the image targetPort.
   */
  React.useEffect(() => {
    const { sampleName, image } = getContainerImportSample();
    if (image) {
      const componentName = getSuggestedName(image);
      setFieldValue('searchTerm', image, false);
      // handleSearch will set the same attributes, but after another API call
      // so we fill these attributes here first
      setFieldValue('name', componentName, false);
      setFieldValue('application.name', `${componentName}-app`, false);
      handleSearch(image);
    }
    if (sampleName) {
      getSample(sampleName)
        .then((sample) => {
          if (isContainerImportSource(sample.spec.source)) {
            const { containerImport } = sample.spec.source;
            if (!image) {
              const componentName = getSuggestedName(containerImport.image);
              setFieldValue('searchTerm', containerImport.image, false);
              // handleSearch will set the same attributes, but after another API call
              // so we fill these attributes here first
              setFieldValue('name', componentName, false);
              setFieldValue('application.name', `${componentName}-app`, false);
            }
            if (
              containerImport?.service?.targetPort &&
              containerImport?.service?.targetPort !== 8080
            ) {
              setFieldValue(
                'route.unknownTargetPort',
                containerImport.service.targetPort.toString(),
                false,
              );
            }
            handleSearch(containerImport.image);
          } else {
            // eslint-disable-next-line no-console
            console.error(
              `Unsupported ConsoleSample "${sampleName}" source type ${sample.spec?.source?.type}`,
            );
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`Error while loading ConsoleSample "${sampleName}":`, error);
        });
    }
    // Disable deps to load the samples only once when the component is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const ImageSearch: React.FC = () => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>();
  const { values, setFieldValue, dirty, initialValues, touched } = useFormikContext<FormikValues>();
  const [newImageSecret, setNewImageSecret] = React.useState('');
  const [alertVisible, shouldHideAlert] = React.useState(true);
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const namespace = values.project.name;
  const { application = {}, name: nameTouched } = touched;
  const { name: applicationNameTouched } = application as FormikTouched<{ name: boolean }>;

  const handleSearch = React.useCallback(
    (searchTermImage: string, isAllowInsecureRegistry = values.allowInsecureRegistry) => {
      setFieldValue('isSearchingForImage', true);
      setValidated(ValidatedOptions.default);
      const importImage = {
        kind: 'ImageStreamImport',
        apiVersion: 'image.openshift.io/v1',
        metadata: {
          name: 'newapp',
          namespace: values.project.name,
        },
        spec: {
          import: false,
          images: [
            {
              from: {
                kind: 'DockerImage',
                name: _.trim(searchTermImage),
              },
              importPolicy: { insecure: isAllowInsecureRegistry },
            },
          ],
        },
        status: {},
      };

      k8sCreate(ImageStreamImportsModel, importImage)
        .then((imageStreamImport) => {
          const status = _.get(imageStreamImport, 'status.images[0].status');
          if (status.status === 'Success') {
            const name = _.get(imageStreamImport, 'spec.images[0].from.name');
            const image = _.get(imageStreamImport, 'status.images[0].image');
            const tag = _.get(imageStreamImport, 'status.images[0].tag');
            const isi = { name, image, tag, status };
            const ports = getPorts(isi);
            setFieldValue('isSearchingForImage', false);
            setFieldValue('isi.name', name);
            setFieldValue('isi.image', image);
            setFieldValue('isi.tag', tag);
            setFieldValue('isi.status', status);
            setFieldValue('isi.ports', ports);
            setFieldValue('image.ports', ports);
            setFieldValue('image.tag', tag);
            !values.name && setFieldValue('name', getSuggestedName(name));
            !values.application.name &&
              values.application.selectedKey !== UNASSIGNED_KEY &&
              setFieldValue('application.name', `${getSuggestedName(name)}-app`);
            // set default port value
            const targetPort =
              (!initialValues.route.targetPort || touched.searchTerm) && _.head(ports);
            targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
            setValidated(ValidatedOptions.success);
          } else {
            setFieldValue('isSearchingForImage', false);
            setFieldValue('isi', {});
            setFieldValue('isi.status', status);
            setFieldValue('route.targetPort', null);
            setValidated(ValidatedOptions.error);
          }
        })
        .catch((error) => {
          setFieldValue('isi', {});
          setFieldValue('isi.status', { metadata: {}, status: '', message: error.message });
          setFieldValue('isSearchingForImage', false);
          setValidated(ValidatedOptions.error);
        });
    },
    [
      setFieldValue,
      touched,
      values.application.name,
      values.application.selectedKey,
      values.name,
      values.project.name,
      values.allowInsecureRegistry,
      initialValues.route.targetPort,
    ],
  );

  useQueryParametersIfDefined(handleSearch);

  const debouncedHandleSearch = useDebounceCallback(handleSearch);

  const handleSave = React.useCallback(
    (name: string) => {
      setNewImageSecret(name);
      values.searchTerm && handleSearch(values.searchTerm);
    },
    [handleSearch, values.searchTerm],
  );

  const getHelpText = () => {
    if (values.isSearchingForImage) {
      return `${t('devconsole~Validating')}...`;
    }
    if (!values.isSearchingForImage && validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    return '';
  };

  const resetFields = () => {
    if (values.formType === 'edit') {
      values.application.selectedKey !== UNASSIGNED_KEY &&
        values.application.selectedKey === CREATE_APPLICATION_KEY &&
        !applicationNameTouched &&
        setFieldValue('application.name', '');
      return;
    }
    !nameTouched && setFieldValue('name', '');
    !values.application.isInContext &&
      values.application.selectedKey !== UNASSIGNED_KEY &&
      !applicationNameTouched &&
      setFieldValue('application.name', '');
  };

  const helpTextInvalid = validated === ValidatedOptions.error && (
    <span className="odc-image-search__helper-text-invalid">
      {values.searchTerm === '' ? 'Required' : values.isi.status?.message}
    </span>
  );

  React.useEffect(() => {
    !dirty && values.searchTerm && handleSearch(values.searchTerm);
  }, [dirty, handleSearch, values.searchTerm]);

  React.useEffect(() => {
    if (touched.searchTerm && initialValues.searchTerm !== values.searchTerm) {
      const targetPort: ContainerPort = _.head(values.isi.ports);
      targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
    }
  }, [
    touched.searchTerm,
    setFieldValue,
    values.isi.ports,
    initialValues.searchTerm,
    values.searchTerm,
  ]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <InputField
        ref={inputRef}
        type={TextInputTypes.text}
        name="searchTerm"
        placeholder={t(
          'devconsole~docker.io/openshift/hello-openshift or quay.io/<username>/<image-name>',
        )}
        helpText={getHelpText()}
        helpTextInvalid={helpTextInvalid}
        validated={validated}
        onChange={(e: KeyboardEvent) => {
          resetFields();
          setFieldValue('isi', {});
          setValidated(ValidatedOptions.default);
          debouncedHandleSearch((e.target as HTMLInputElement).value);
        }}
        aria-label={t('devconsole~Image name')}
        data-test-id="deploy-image-search-term"
        required
      />
      <div className="help-block" id="image-name-help">
        <Trans ns="devconsole" t={t}>
          To deploy an Image from a private registry, you must{' '}
          <Button
            variant="link"
            isInline
            onClick={() =>
              secretModalLauncher({
                namespace,
                save: handleSave,
                secretType: SecretTypeAbstraction.image,
              })
            }
          >
            create an Image pull secret
          </Button>{' '}
          with your Image registry credentials.
        </Trans>
      </div>
      {newImageSecret && alertVisible && (
        <Alert
          isInline
          className="co-alert"
          variant="success"
          title={t('devconsole~Secret "{{newImageSecret}}" was created.', { newImageSecret })}
          actionClose={<AlertActionCloseButton onClose={() => shouldHideAlert(false)} />}
        />
      )}
      <div className="odc-image-search__advanced-options">
        <CheckboxField
          name="allowInsecureRegistry"
          label={t('devconsole~Allow Images from insecure registries')}
          onChange={(val: boolean) => {
            values.searchTerm && handleSearch(values.searchTerm, val);
          }}
        />
      </div>
    </>
  );
};

export default ImageSearch;
