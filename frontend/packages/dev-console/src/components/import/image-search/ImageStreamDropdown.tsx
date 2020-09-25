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

  const onDropdownChange = React.useCallback(
    (img: string) => {
      setFieldValue('imageStream.tag', initialValues.imageStream.tag);
      setFieldValue('isi', initialValues.isi);
      const image = _.get(imgCollection, [imageStream.namespace, img], {});
      dispatch({ type: ImageStreamActions.setSelectedImageStream, value: image });
    },
    [
      setFieldValue,
      initialValues.imageStream.tag,
      initialValues.isi,
      imgCollection,
      imageStream.namespace,
      dispatch,
    ],
  );
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

  React.useEffect(() => {
    imageStream.image && onDropdownChange(imageStream.image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageStream.image, isStreamsAvailable]);

  React.useEffect(() => {
    if (initialValues.imageStream.image !== imageStream.image) {
      initialValues.imageStream.tag = '';
    }
  }, [imageStream.image, initialValues.imageStream.image, initialValues.imageStream.tag]);

  return (
    <ResourceDropdownField
      name="imageStream.image"
      label="Image Stream"
      resources={getImageStreamResource(imageStream.namespace)}
      dataSelector={['metadata', 'name']}
      key={imageStream.namespace}
      fullWidth
      required
      title={imageStream.image || getTitle()}
      disabled={!hasCreateAccess || !isStreamsAvailable}
      onChange={onDropdownChange}
      onLoad={onLoad}
      resourceFilter={resourceFilter}
    />
  );
};

export default ImageStreamDropdown;
