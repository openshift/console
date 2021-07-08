import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceDropdownField } from '@console/shared';
import { getImageStreamResource } from '../../../utils/imagestream-utils';
import { ImageStreamActions } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamDropdown: React.FC<{ disabled?: boolean; formContextField?: string }> = ({
  disabled = false,
  formContextField,
}) => {
  const { t } = useTranslation();
  const imgCollection = {};

  const { values, setFieldValue, initialValues } = useFormikContext<FormikValues>();
  const { imageStream } = _.get(values, formContextField) || values;
  const { imageStream: initialImageStream, isi: initialIsi } =
    _.get(initialValues, formContextField) || initialValues;
  const { state, dispatch, hasImageStreams, setHasImageStreams } = React.useContext(
    ImageStreamContext,
  );
  const { accessLoading, loading } = state;
  const isNamespaceSelected = imageStream.namespace !== '' && !accessLoading;
  const isStreamsAvailable = isNamespaceSelected && hasImageStreams && !loading;
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const collectImageStreams = (namespace: string, resource: K8sResourceKind): void => {
    if (!imgCollection[namespace]) {
      imgCollection[namespace] = {};
    }
    imgCollection[namespace][resource.metadata.name] = resource;
  };
  const getTitle = () => {
    return loading && !isStreamsAvailable
      ? ''
      : !isStreamsAvailable
      ? t('devconsole~No Image Stream')
      : t('devconsole~Select Image Stream');
  };

  const onDropdownChange = React.useCallback(
    (img: string) => {
      setFieldValue(`${fieldPrefix}imageStream.tag`, initialImageStream.tag);
      setFieldValue(`${fieldPrefix}isi`, initialIsi);
      const image = _.get(imgCollection, [imageStream.namespace, img], {});
      dispatch({ type: ImageStreamActions.setSelectedImageStream, value: image });
    },
    [
      setFieldValue,
      fieldPrefix,
      initialImageStream.tag,
      initialIsi,
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
    if (initialImageStream.image !== imageStream.image) {
      initialImageStream.tag = '';
    }
  }, [imageStream.image, initialImageStream.image, initialImageStream.tag]);

  return (
    <ResourceDropdownField
      name={`${fieldPrefix}imageStream.image`}
      label={t('devconsole~Image Stream')}
      resources={getImageStreamResource(imageStream.namespace)}
      dataSelector={['metadata', 'name']}
      key={imageStream.namespace}
      fullWidth
      required
      title={imageStream.image || getTitle()}
      disabled={!isStreamsAvailable || disabled}
      onChange={onDropdownChange}
      onLoad={onLoad}
      resourceFilter={resourceFilter}
    />
  );
};

export default ImageStreamDropdown;
