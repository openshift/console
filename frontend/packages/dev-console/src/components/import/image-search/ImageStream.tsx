import * as React from 'react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamTagModel } from '@console/internal/models';
import { DropdownField } from '../../formik-fields';
import { ImageStreamProps } from '../import-types';
import {
  getSuggestedName,
  getPorts,
  makePortName,
  normalizeBuilderImages,
  NormalizedBuilderImages,
  BuilderImage,
  registryType,
  builderImagesNamespace,
} from '../../../utils/imagestream-utils';
import './ImageStream.scss';

const ImageStream: React.FC<ImageStreamProps> = ({ imageStreams }) => {
  const projectList = {};

  imageStreams.reduce((acc, { metadata: { namespace } }) => {
    if (!acc[namespace]) {
      acc[namespace] = namespace;
    }
    return acc;
  }, projectList);

  const [imageNamespace] = useField('imageStream.namespace');
  const [imageTag] = useField('imageStream.tag');
  const [imageName] = useField('imageStream.image');
  const { values, setFieldValue, setFieldError, initialValues } = useFormikContext<FormikValues>();
  const [selectedProject, setselectedProject] = React.useState(imageNamespace.value);
  const [selectedTag, setselectedTag] = React.useState(imageTag.value);
  const [selectedName, setselectedName] = React.useState(imageName.value);

  const searchImageTag = React.useCallback(() => {
    setFieldValue('isSearchingForImage', true);
    k8sGet(ImageStreamTagModel, `${imageName.value}:${imageTag.value}`, imageNamespace.value)
      .then((imageStreamImport) => {
        const { image, tag, status } = imageStreamImport;
        const name = imageName.value;
        const isi = { name, image, tag, status };
        const ports = getPorts(isi);
        setFieldValue('isSearchingForImage', false);
        setFieldValue('isi.name', name);
        setFieldValue('isi.image', image);
        setFieldValue('isi.tag', imageTag.value);
        setFieldValue('isi.ports', ports);
        setFieldValue('image.ports', ports);
        setFieldValue('name', getSuggestedName(name));
        !values.application.name &&
          setFieldValue('application.name', `${getSuggestedName(name)}-app`);
        // set default port value
        const targetPort = _.head(ports);
        targetPort && setFieldValue('route.targetPort', makePortName(targetPort));
      })
      .catch((error) => {
        setFieldError('isi.image', error.message);
        setFieldValue('isi', {});
        setFieldValue('isSearchingForImage', false);
      });
  }, [
    setFieldValue,
    imageName.value,
    imageTag.value,
    imageNamespace.value,
    values.application.name,
    setFieldError,
  ]);
  const getImageStreamByNamespace = (ns: string) => {
    const imageStreamsList = {};
    const isBuilderImageNamespace = ns === builderImagesNamespace.Openshift;
    const imgStreams = isBuilderImageNamespace
      ? (normalizeBuilderImages(imageStreams) as NormalizedBuilderImages)
      : (imageStreams as K8sResourceKind[]);
    _.each(imgStreams, (img: BuilderImage | K8sResourceKind) => {
      const { name, namespace } = isBuilderImageNamespace
        ? (img as BuilderImage).obj.metadata
        : (img as K8sResourceKind).metadata;
      if (namespace === ns) {
        imageStreamsList[name] = name;
      }
    });
    return imageStreamsList;
  };
  const getImageStreamTags = (name: string) => {
    const tags = {};
    const imageStream = _.find(imageStreams, ['metadata.name', name]);
    name &&
      !_.isEmpty(imageStream) &&
      _.each(imageStream.status.tags, ({ tag }) => {
        tags[tag] = tag;
      });
    return tags;
  };
  React.useEffect(() => {
    if (imageNamespace.value !== selectedProject) {
      setselectedProject(imageNamespace.value);
      setFieldValue('imageStream.image', '');
      setFieldValue('imageStream.tag', '');
      setFieldValue('isi', initialValues.isi);
    }
    if (imageName.value !== selectedName) {
      setselectedName(imageName.value);
      setFieldValue('imageStream.tag', '');
    }
    if (imageTag.value !== selectedTag) {
      setselectedTag(imageTag.value);
      imageTag.value !== '' && searchImageTag();
    }
  }, [
    imageNamespace,
    imageName,
    imageTag,
    selectedProject,
    selectedName,
    selectedTag,
    setFieldValue,
    initialValues.isi,
    searchImageTag,
  ]);

  return (
    <>
      <div className="row">
        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <DropdownField
            name="imageStream.namespace"
            label="Projects"
            items={projectList}
            title="Project"
            fullWidth
            required
          />
        </div>
        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <DropdownField
            name="imageStream.image"
            label="ImageStreams"
            items={getImageStreamByNamespace(values.imageStream.namespace)}
            title="ImageStreams"
            fullWidth
            disabled={values.imageStream.namespace === ''}
            required
          />
          <div className="odc-imagestream-separator">/</div>
        </div>
        <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
          <DropdownField
            name="imageStream.tag"
            label="Tag"
            items={getImageStreamTags(values.imageStream.image)}
            title="Tag"
            disabled={values.imageStream.image === ''}
            fullWidth
            required
          />
          <div className="odc-imagestream-separator">:</div>
        </div>
      </div>
      {values.registry === registryType.Internal &&
        imageNamespace.value &&
        imageNamespace.value !== builderImagesNamespace.Openshift &&
        values.project.name !== imageNamespace.value && (
          <div className="row odc-imagestream-alert">
            <div className="col-lg-12">
              <Alert
                variant="warning"
                title="add cluster policy to use internal imagestream"
                isInline
              >
                Service account <strong>default</strong> will need image pull authority to deploy
                images from <strong>{imageNamespace.value}</strong>. You can grant authority with
                the command:
                <p>
                  <code>
                    oc policy add-role-to-user system:image-puller system:serviceaccount:
                    {values.project.name}:default -n {imageNamespace.value}
                  </code>
                </p>
              </Alert>
            </div>
          </div>
        )}
    </>
  );
};

export default ImageStream;
