import * as React from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useFormikContext, FormikValues, getIn } from 'formik';
import { ValidatedOptions } from '@patternfly/react-core';
import { DropdownField } from '@console/shared';
import { k8sGet, K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { ImageStreamTagModel } from '@console/internal/models';
import { UNASSIGNED_KEY } from '../../../const';
import {
  getImageStreamTags,
  getPorts,
  getSuggestedName,
  makePortName,
  imageStreamLabels,
} from '../../../utils/imagestream-utils';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamTagDropdown: React.FC = () => {
  let imageStreamTagList = {};
  const {
    values: {
      name: resourceName,
      imageStream,
      application,
      formType,
      isi: { ports: isiPorts },
    },
    setFieldValue,
    initialValues,
    touched,
  } = useFormikContext<FormikValues>();
  const { state, hasImageStreams, setValidated } = React.useContext(ImageStreamContext);
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
          const {
            image,
            tag,
            status,
            metadata: { labels },
          } = imageStreamImport;

          const imgStreamLabels = _.pick(labels, imageStreamLabels);
          const name = imageStream.image;
          const isi = { name, image, tag, status };
          const ports = getPorts(isi);
          setFieldValue('isSearchingForImage', false);
          setFieldValue('isi.name', name);
          setFieldValue('isi.image', _.merge(image, { metadata: { labels: imgStreamLabels } }));
          setFieldValue('isi.tag', selectedTag);
          setFieldValue('isi.ports', ports);
          setFieldValue('image.ports', ports);
          !resourceName && formType !== 'edit' && setFieldValue('name', getSuggestedName(name));
          application.selectedKey !== UNASSIGNED_KEY &&
            !application.name &&
            setFieldValue('application.name', `${getSuggestedName(name)}-app`);
          // set default port value
          const targetPort =
            (!initialValues.route.targetPort || getIn(touched.imageStream, 'image')) &&
            !getIn(touched.route, 'targetPort') &&
            _.head(ports);
          targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
          setValidated(ValidatedOptions.success);
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
      imageStream.image,
      formType,
      application.selectedKey,
      application.name,
      resourceName,
      setValidated,
      imageStream.namespace,
      initialValues.route.targetPort,
      touched.imageStream,
      touched.route,
    ],
  );

  React.useEffect(() => {
    imageStream.tag && searchImageTag(imageStream.tag);
  }, [imageStream.tag, searchImageTag]);

  React.useEffect(() => {
    if (
      getIn(touched.imageStream, 'image') &&
      !getIn(touched.route, 'targetPort') &&
      !_.isEqual(initialValues.imageStream.image, imageStream.image)
    ) {
      const targetPort: ContainerPort = _.head(isiPorts);
      targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
    }
  }, [
    touched.route,
    touched.imageStream,
    initialValues.imageStream.image,
    imageStream.image,
    setFieldValue,
    isiPorts,
  ]);

  return (
    <DropdownField
      name="imageStream.tag"
      label="Tag"
      items={imageStreamTagList}
      key={imageStream.image}
      autocompleteFilter={fuzzy}
      title={
        imageStream.tag ||
        (isNamespaceSelected && isImageStreamSelected && !isTagsAvailable ? 'No Tag' : 'Select Tag')
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
