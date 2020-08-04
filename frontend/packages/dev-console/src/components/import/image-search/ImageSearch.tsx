import * as React from 'react';
import * as _ from 'lodash';
import { k8sCreate, ContainerPort } from '@console/internal/module/k8s';
import { ImageStreamImportsModel } from '@console/internal/models';
import { useFormikContext, FormikValues, FormikTouched } from 'formik';
import {
  TextInputTypes,
  Alert,
  AlertActionCloseButton,
  Button,
  ValidatedOptions,
} from '@patternfly/react-core';
import { SecretTypeAbstraction } from '@console/internal/components/secrets/create-secret';
import { InputField, useDebounceCallback, CheckboxField } from '@console/shared';
import { getSuggestedName, getPorts, makePortName } from '../../../utils/imagestream-utils';
import { secretModalLauncher } from '../CreateSecretModal';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '../../../const';
import './ImageSearch.scss';

const ImageSearch: React.FC = () => {
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

  const debouncedHandleSearch = useDebounceCallback(handleSearch, [handleSearch]);

  const handleSave = React.useCallback(
    (name: string) => {
      setNewImageSecret(name);
      values.searchTerm && handleSearch(values.searchTerm);
    },
    [handleSearch, values.searchTerm],
  );

  const getHelpText = () => {
    if (values.isSearchingForImage) {
      return 'Validating...';
    }
    if (!values.isSearchingForImage && validated === ValidatedOptions.success) {
      return 'Validated';
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
    values.application.selectedKey !== UNASSIGNED_KEY &&
      !applicationNameTouched &&
      setFieldValue('application.name', '');
  };

  const helpTextInvalid = validated === ValidatedOptions.error && (
    <span>{values.searchTerm === '' ? 'Required' : values.isi.status?.message}</span>
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

  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name="searchTerm"
        placeholder="Enter an image name"
        helpText={getHelpText()}
        helpTextInvalid={helpTextInvalid}
        validated={validated}
        onChange={(e: KeyboardEvent) => {
          resetFields();
          setFieldValue('isi', {});
          setValidated(ValidatedOptions.default);
          debouncedHandleSearch((e.target as HTMLInputElement).value);
        }}
        data-test-id="deploy-image-search-term"
        required
      />
      <div className="help-block" id="image-name-help">
        To deploy an image from a private repository, you must{' '}
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
          create an image pull secret
        </Button>{' '}
        with your image registry credentials.
      </div>
      {newImageSecret && alertVisible && (
        <Alert
          isInline
          className="co-alert"
          variant="success"
          title={`Secret ${newImageSecret} was created.`}
          actionClose={<AlertActionCloseButton onClose={() => shouldHideAlert(false)} />}
        />
      )}
      <div className="odc-image-search__advanced-options">
        <CheckboxField
          name="allowInsecureRegistry"
          label="Allow images from insecure registries"
          onChange={(val: boolean) => {
            values.searchTerm && handleSearch(values.searchTerm, val);
          }}
        />
      </div>
    </>
  );
};

export default ImageSearch;
