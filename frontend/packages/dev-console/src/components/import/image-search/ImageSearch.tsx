import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { k8sCreate } from '@console/internal/module/k8s';
import { ImageStreamImportsModel } from '@console/internal/models';
import { getPorts } from '@console/internal/components/source-to-image';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputSearchField } from '../../formik-fields';

const getSuggestedName = (name: string): string | undefined => {
  if (!name) {
    return undefined;
  }

  const imageName: string = _.last(name.split('/'));

  return _.first(imageName.split(/[^a-z0-9-]/));
};

const ImageSearch: React.FC = () => {
  const { values, setFieldValue, setFieldError } = useFormikContext<FormikValues>();
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
          values.name === '' && setFieldValue('name', getSuggestedName(name));
        } else {
          setFieldValue('isSearchingForImage', false);
          setFieldValue('isi', {});
          setFieldError('isi.image', status.message);
        }
      })
      .catch((error) => {
        setFieldError('isi.image', error.message);
        setFieldValue('isi', {});
        setFieldValue('isSearchingForImage', false);
      });
  };

  return (
    <React.Fragment>
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
        <Link to={`/k8s/ns/${values.project.name || 'default'}/secrets/~new/image`}>
          create an image pull secret
        </Link>{' '}
        with your image registry credentials.
      </div>
    </React.Fragment>
  );
};

export default ImageSearch;
