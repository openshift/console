import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { useFormikContext, FormikValues, getIn } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ImageStreamTagModel } from '@console/internal/models';
import { k8sGet, K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { DropdownField } from '@console/shared';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import {
  getImageStreamTags,
  getPorts,
  getSuggestedName,
  makePortName,
  imageStreamLabels,
} from '../../../utils/imagestream-utils';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamTagDropdown: React.FC<{ disabled?: boolean; formContextField?: string }> = ({
  disabled = false,
  formContextField,
}) => {
  const { t } = useTranslation();
  const unmounted = React.useRef(false);
  let imageStreamTagList = {};
  const { values, setFieldValue, initialValues, touched } = useFormikContext<FormikValues>();
  const {
    name: resourceName,
    imageStream,
    application,
    formType,
    isi: { ports: isiPorts },
  } = _.get(values, formContextField) || values;
  const { imageStream: initialImageStream, route: initialRoute } =
    _.get(initialValues, formContextField) || initialValues;
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const { state, hasImageStreams, setValidated } = React.useContext(ImageStreamContext);
  const { selectedImageStream, accessLoading, loading } = state;
  imageStreamTagList = getImageStreamTags(selectedImageStream as K8sResourceKind);
  const isNamespaceSelected = imageStream.namespace !== '' && !accessLoading;
  const isStreamsAvailable = isNamespaceSelected && hasImageStreams && !loading;
  const isTagsAvailable = isStreamsAvailable && !_.isEmpty(imageStreamTagList);
  const isImageStreamSelected = imageStream.image !== '';

  const searchImageTag = React.useCallback(
    (selectedTag: string) => {
      setFieldValue(`${fieldPrefix}isSearchingForImage`, true);
      k8sGet(ImageStreamTagModel, `${imageStream.image}:${selectedTag}`, imageStream.namespace)
        .then((imageStreamImport) => {
          if (unmounted.current) return;
          const {
            image,
            tag,
            status,
            metadata: { labels },
          } = imageStreamImport;
          formContextField && setFieldValue(`${fieldPrefix}imageStreamTag`, imageStreamImport);
          const imgStreamLabels = _.pick(labels, imageStreamLabels);
          const name = imageStream.image;
          const isi = { name, image, tag, status };
          const ports = getPorts(isi);
          setFieldValue(`${fieldPrefix}isSearchingForImage`, false);
          setFieldValue(`${fieldPrefix}isi.name`, name);
          setFieldValue(
            `${fieldPrefix}isi.image`,
            _.merge(image, { metadata: { labels: imgStreamLabels } }),
          );
          setFieldValue(`${fieldPrefix}isi.tag`, selectedTag);
          setFieldValue(`${fieldPrefix}isi.ports`, ports);
          setFieldValue(`${fieldPrefix}image.ports`, ports);
          !resourceName &&
            formType !== 'edit' &&
            setFieldValue(`${fieldPrefix}name`, getSuggestedName(name));
          application &&
            application.selectedKey !== UNASSIGNED_KEY &&
            !application.name &&
            setFieldValue(`${fieldPrefix}application.name`, `${getSuggestedName(name)}-app`);
          // set default port value
          const targetPort =
            initialRoute &&
            (!initialRoute.targetPort ||
              getIn(_.get(touched, `${fieldPrefix}imageStream`), 'image')) &&
            !getIn(_.get(touched, `${fieldPrefix}route`), 'targetPort') &&
            _.head(ports);
          targetPort && setFieldValue(`${fieldPrefix}route.targetPort`, makePortName(targetPort));
          setValidated(ValidatedOptions.success);
        })
        .catch((error) => {
          if (unmounted.current) return;
          setFieldValue(`${fieldPrefix}isi`, {});
          setFieldValue(`${fieldPrefix}isi.status`, {
            metadata: {},
            status: '',
            message: error.message,
          });
          setFieldValue(`${fieldPrefix}isSearchingForImage`, false);
          setValidated(ValidatedOptions.error);
        });
    },
    [
      setFieldValue,
      fieldPrefix,
      imageStream.image,
      imageStream.namespace,
      formContextField,
      resourceName,
      formType,
      application,
      initialRoute,
      touched,
      setValidated,
    ],
  );

  React.useEffect(() => {
    imageStream.tag && searchImageTag(imageStream.tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageStream.tag]);

  React.useEffect(() => {
    if (
      initialRoute &&
      getIn(_.get(touched, `${fieldPrefix}imageStream`), 'image') &&
      !getIn(_.get(touched, `${fieldPrefix}route`), 'targetPort') &&
      !_.isEqual(initialImageStream.image, imageStream.image)
    ) {
      const targetPort: ContainerPort = _.head(isiPorts);
      targetPort && setFieldValue(`${fieldPrefix}route.targetPort`, makePortName(targetPort));
    }
  }, [
    touched.route,
    touched.imageStream,
    imageStream.image,
    setFieldValue,
    isiPorts,
    initialRoute,
    initialImageStream.image,
    fieldPrefix,
    touched,
  ]);

  React.useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  });

  return (
    <DropdownField
      name={`${fieldPrefix}imageStream.tag`}
      label={t('devconsole~Tag')}
      items={imageStreamTagList}
      key={imageStream.image}
      autocompleteFilter={fuzzy}
      title={
        imageStream.tag ||
        (isNamespaceSelected && isImageStreamSelected && !isTagsAvailable
          ? t('devconsole~No tag')
          : t('devconsole~Select tag'))
      }
      disabled={!isImageStreamSelected || !isTagsAvailable || disabled}
      fullWidth
      required
      onChange={(tag) => {
        tag !== '' && searchImageTag(tag);
      }}
    />
  );
};

export default ImageStreamTagDropdown;
