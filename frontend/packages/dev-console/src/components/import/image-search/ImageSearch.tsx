import * as React from 'react';
import * as _ from 'lodash';
import { k8sCreate } from '@console/internal/module/k8s';
import { ImageStreamImportsModel } from '@console/internal/models';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes, Alert, AlertActionCloseButton, Button } from '@patternfly/react-core';
import { SecretTypeAbstraction } from '@console/internal/components/secrets/create-secret';
import { InputSearchField } from '@console/shared/src/components/formik-fields';
import { getSuggestedName, getPorts, makePortName } from '../../../utils/imagestream-utils';
import { secretModalLauncher } from '../CreateSecretModal';

const ImageSearch: React.FC = () => {
  const { values, setFieldValue, setFieldError } = useFormikContext<FormikValues>();
  const [newImageSecret, setNewImageSecret] = React.useState('');
  const [alertVisible, shouldHideAlert] = React.useState(true);
  const namespace = values.project.name;
  const handleSearch = (searchTerm: string) => {
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
              name: _.trim(searchTerm),
            },
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
            setFieldValue('application.name', `${getSuggestedName(name)}-app`);
          // set default port value
          const targetPort = _.head(ports);
          targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
        } else {
          setFieldValue('isSearchingForImage', false);
          setFieldValue('isi', {});
          setFieldError('isi.image', status.message);
          setFieldValue('route.targetPort', null);
        }
      })
      .catch((error) => {
        setFieldError('isi.image', error.message);
        setFieldValue('isi', {});
        setFieldValue('isSearchingForImage', false);
      });
  };

  const handleSave = (name: string) => {
    setNewImageSecret(name);
    values.searchTerm && handleSearch(values.searchTerm);
  };

  return (
    <>
      <InputSearchField
        type={TextInputTypes.text}
        data-test-id="deploy-image-search-term"
        name="searchTerm"
        label="Image Name"
        onSearch={handleSearch}
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
          action={<AlertActionCloseButton onClose={() => shouldHideAlert(false)} />}
        />
      )}
    </>
  );
};

export default ImageSearch;
