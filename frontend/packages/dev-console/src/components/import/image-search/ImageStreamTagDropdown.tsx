import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { DropdownField } from '@console/shared';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamTagModel } from '@console/internal/models';
import {
  getImageStreamTags,
  getPorts,
  getSuggestedName,
  makePortName,
} from '../../../utils/imagestream-utils';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamTagDropdown: React.FC = () => {
  let imageStreamTagList = {};
  const {
    values: { imageStream, application, formType },
    setFieldValue,
    setFieldError,
  } = useFormikContext<FormikValues>();
  const { state, hasImageStreams } = React.useContext(ImageStreamContext);
  const { selectedImageStream, accessLoading, loading } = state;
  imageStreamTagList = getImageStreamTags(selectedImageStream as K8sResourceKind);
  const isNamespaceSelected = imageStream.namespace !== '' && !accessLoading;
  const isStreamsAvailable = isNamespaceSelected && hasImageStreams && !loading;
  const isTagsAvailable = isStreamsAvailable && !_.isEmpty(imageStreamTagList);
  const isImageStreamSelected = imageStream.image !== '';

  const searchImageTag = React.useCallback(
    (selectedTag: string) => {
      setFieldValue('isSearchingForImage', true);
      k8sGet(ImageStreamTagModel, `${imageStream.image}:${selectedTag}`, imageStream.namespace)
        .then((imageStreamImport) => {
          const { image, tag, status } = imageStreamImport;
          const name = imageStream.image;
          const isi = { name, image, tag, status };
          const ports = getPorts(isi);
          setFieldValue('isSearchingForImage', false);
          setFieldValue('isi.name', name);
          setFieldValue('isi.image', image);
          setFieldValue('isi.tag', selectedTag);
          setFieldValue('isi.ports', ports);
          setFieldValue('image.ports', ports);
          formType !== 'edit' && setFieldValue('name', getSuggestedName(name));
          !application.name && setFieldValue('application.name', `${getSuggestedName(name)}-app`);
          // set default port value
          const targetPort = _.head(ports);
          targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
        })
        .catch((error) => {
          setFieldError('isi.image', error.message);
          setFieldValue('isi', {});
          setFieldValue('isSearchingForImage', false);
        });
    },
    [
      setFieldValue,
      imageStream.image,
      imageStream.namespace,
      formType,
      application.name,
      setFieldError,
    ],
  );

  React.useEffect(() => {
    imageStream.tag && searchImageTag(imageStream.tag);
  }, [imageStream.tag, searchImageTag]);

  return (
    <DropdownField
      name="imageStream.tag"
      label="Tag"
      items={imageStreamTagList}
      key={imageStream.image}
      title={
        !_.isEmpty(imageStream.tag)
          ? imageStream.tag
          : isNamespaceSelected && isImageStreamSelected && !isTagsAvailable
          ? 'No Tag'
          : 'Select Tag'
      }
      disabled={!isImageStreamSelected || !isTagsAvailable}
      fullWidth
      required
      onChange={(tag) => {
        tag !== '' && searchImageTag(tag);
      }}
    />
  );
};

export default ImageStreamTagDropdown;
