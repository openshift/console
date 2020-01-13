import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceDropdownField } from '@console/shared';
import { getImageStreamResource } from '../../../utils/imagestream-utils';
import { ImageStreamActions } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamDropdown: React.FC = () => {
  const imgCollection = {};

  const {
    values: { imageStream },
    setFieldValue,
    initialValues,
  } = useFormikContext<FormikValues>();
  const { state, dispatch, hasImageStreams, setHasImageStreams } = React.useContext(
    ImageStreamContext,
  );
  const { accessLoading, loading, hasCreateAccess } = state;
  const isNamespaceSelected = imageStream.namespace !== '' && !accessLoading;
  const isStreamsAvailable = isNamespaceSelected && hasImageStreams && !loading;
  const collectImageStreams = (namespace: string, resource: K8sResourceKind): void => {
    if (!imgCollection[namespace]) {
      imgCollection[namespace] = {};
    }
    imgCollection[namespace][resource.metadata.name] = resource;
  };
  const getTitle = () => {
    return loading && !isStreamsAvailable
      ? ''
      : !isStreamsAvailable || !hasCreateAccess
      ? 'No Image Stream'
      : 'Select Image Stream';
  };
  const onDropdownChange = (img: string) => {
    setFieldValue('imageStream.tag', '');
    setFieldValue('isi', initialValues.isi);
    const image = imgCollection[imageStream.namespace][img];
    dispatch({ type: ImageStreamActions.setSelectedImageStream, value: image });
  };
  const onLoad = (imgstreams) => {
    const imageStreamAvailable = !_.isEmpty(imgstreams);
    setHasImageStreams(imageStreamAvailable);
    loading &&
      isNamespaceSelected &&
      dispatch({ type: ImageStreamActions.setLoading, value: false });
  };
  const resourceFilter = (resource: K8sResourceKind) => {
    const {
      metadata: { namespace },
    } = resource;
    collectImageStreams(namespace, resource);
    return namespace === imageStream.namespace;
  };
  return (
    <ResourceDropdownField
      name="imageStream.image"
      label="ImageStreams"
      resources={getImageStreamResource(imageStream.namespace)}
      dataSelector={['metadata', 'name']}
      key={imageStream.namespace}
      fullWidth
      required
      title={!_.isEmpty(imageStream.image) ? imageStream.image : getTitle()}
      disabled={!hasCreateAccess || !isStreamsAvailable}
      onChange={onDropdownChange}
      onLoad={onLoad}
      resourceFilter={resourceFilter}
    />
  );
};

export default ImageStreamDropdown;
