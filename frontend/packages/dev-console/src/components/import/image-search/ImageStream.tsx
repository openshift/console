import * as React from 'react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { k8sGet } from '@console/internal/module/k8s';
import { ImageStreamTagModel, RoleBindingModel } from '@console/internal/models';
import { useAccessReview } from '@console/internal/components/utils';
import { DropdownField, CheckboxField } from '../../formik-fields';
import { ImageStreamProps } from '../import-types';
import {
  getSuggestedName,
  getPorts,
  makePortName,
  RegistryType,
  getProjectResource,
  BuilderImagesNamespace,
  getImageStreamByNamespace,
  getImageStreamTags,
} from '../../../utils/imagestream-utils';
import './ImageStream.scss';
import ResourceDropdownField from '../../formik-fields/ResourceDropdownField';

const ImageStream: React.FC<ImageStreamProps> = ({ imageStreams }) => {
  const resources = getProjectResource();
  let imageStreamList = {};
  let imageStreamTagList = {};

  const {
    values: { imageStream, application, project, registry },
    setFieldValue,
    setFieldError,
    initialValues,
  } = useFormikContext<FormikValues>();
  const [hasAccessToPullImage, setHasAccessToPullImage] = React.useState(false);

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
          setFieldValue('name', getSuggestedName(name));
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
    [setFieldValue, imageStream, application.name, setFieldError],
  );

  const hasCreateAccess = useAccessReview({
    group: RoleBindingModel.apiGroup,
    resource: RoleBindingModel.plural,
    verb: 'create',
    name: 'system:image-puller',
    namespace: imageStream.namespace,
  });
  if (hasCreateAccess) {
    imageStreamList = getImageStreamByNamespace(imageStreams, imageStream.namespace);
    imageStreamTagList = getImageStreamTags(imageStreams, imageStream.image, imageStream.namespace);
  }
  const isNamespaceSelected = imageStream.namespace !== '';
  const isStreamsAvailable = isNamespaceSelected && !_.isEmpty(imageStreamList);
  const isTagsAvailable = isStreamsAvailable && !_.isEmpty(imageStreamTagList);
  const isImageStreamSelected = imageStream.image !== '';
  const canGrantAccess =
    hasCreateAccess &&
    isStreamsAvailable &&
    isTagsAvailable &&
    !hasAccessToPullImage &&
    isNamespaceSelected &&
    registry === RegistryType.Internal &&
    imageStream.namespace !== BuilderImagesNamespace.Openshift &&
    project.name !== imageStream.namespace;

  return (
    <>
      <div className="row">
        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <ResourceDropdownField
            name="imageStream.namespace"
            label="Projects"
            title="Select Project"
            fullWidth
            required
            resources={resources}
            dataSelector={['metadata', 'name']}
            onChange={(selectedProject) => {
              setFieldValue('imageStream.image', '');
              setFieldValue('imageStream.tag', '');
              setFieldValue('isi', initialValues.isi);
              k8sGet(RoleBindingModel, 'system:image-puller', selectedProject)
                .then(() => {
                  setHasAccessToPullImage(true);
                  setFieldValue('imageStream.grantAccess', false);
                })
                .catch(() => setHasAccessToPullImage(false));
            }}
          />
        </div>
        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <DropdownField
            name="imageStream.image"
            label="ImageStreams"
            items={imageStreamList}
            title={
              isNamespaceSelected && !isStreamsAvailable ? 'No Image Stream' : 'Select Image Stream'
            }
            fullWidth
            disabled={!isNamespaceSelected || (isNamespaceSelected && !isStreamsAvailable)}
            required
            onChange={() => {
              setFieldValue('imageStream.tag', '');
              setFieldValue('isi', initialValues.isi);
            }}
          />
          <div className="odc-imagestream-separator">/</div>
        </div>
        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <DropdownField
            name="imageStream.tag"
            label="Tag"
            items={imageStreamTagList}
            title={
              isNamespaceSelected && isImageStreamSelected && !isTagsAvailable
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
          <div className="odc-imagestream-separator">:</div>
        </div>
      </div>
      {isNamespaceSelected && isImageStreamSelected && !isTagsAvailable && hasCreateAccess && (
        <div className="odc-imagestream-alert">
          <Alert variant="warning" title="No Image streams tags found" isInline>
            No tags are available in image stream {imageStream.image}
          </Alert>
        </div>
      )}
      {isNamespaceSelected && !isStreamsAvailable && hasCreateAccess && (
        <div className="odc-imagestream-alert">
          <Alert variant="warning" title="No Image streams found" isInline>
            No image streams are available in project {imageStream.namespace}
          </Alert>
        </div>
      )}
      {isNamespaceSelected && !hasCreateAccess && (
        <div className="odc-imagestream-alert">
          <Alert variant="warning" title="Permission denied" isInline>
            Service account default does not have authority to pull images from{' '}
            {imageStream.namespace}. Select another project to continue.
          </Alert>
        </div>
      )}
      {canGrantAccess && (
        <div className="odc-imagestream-alert">
          <CheckboxField
            name="imageStream.grantAccess"
            label={`Grant service account default authority to pull images from
                ${imageStream.namespace}`}
          />
        </div>
      )}
    </>
  );
};

export default React.memo(ImageStream);
