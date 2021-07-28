import * as React from 'react';
import {
  Alert,
  ClipboardCopy,
  ClipboardCopyVariant,
  FormGroup,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  RegistryType,
  BuilderImagesNamespace,
  getImageStreamTags,
} from '../../../utils/imagestream-utils';
import { ImageStreamState, ImageStreamAction, ImageStreamActions } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';
import ImageStreamDropdown from './ImageStreamDropdown';
import ImageStreamNsDropdown from './ImageStreamNsDropdown';
import ImageStreamTagDropdown from './ImageStreamTagDropdown';

import './ImageStream.scss';

export const initialState: ImageStreamState = {
  loading: false,
  accessLoading: false,
  selectedImageStream: {},
};

export const ImageStreamReducer = (state: ImageStreamState, action: ImageStreamAction) => {
  const { value } = action;
  switch (action.type) {
    case ImageStreamActions.setLoading:
      return { ...state, loading: value };
    case ImageStreamActions.setAccessLoading:
      return { ...state, accessLoading: value };
    case ImageStreamActions.setSelectedImageStream:
      return { ...state, selectedImageStream: value };
    default:
      throw new Error('Invalid action was provided in imagestream reducer');
  }
};

const ImageStream: React.FC<{
  disabled?: boolean;
  label?: string;
  required?: boolean;
  formContextField?: string;
  dataTest?: string;
}> = ({ disabled = false, label, required = false, formContextField, dataTest }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<FormikValues>();
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [state, dispatch] = React.useReducer(ImageStreamReducer, initialState);
  const [hasImageStreams, setHasImageStreams] = React.useState(false);
  const { loading, accessLoading, selectedImageStream } = state;
  const { imageStream, project, registry, isi, fromImageStreamTag } =
    _.get(values, formContextField) || values;

  const imageStreamTagList = getImageStreamTags(selectedImageStream as K8sResourceKind);
  const isNamespaceSelected = imageStream.namespace !== '' && !accessLoading;
  const isStreamsAvailable = isNamespaceSelected && hasImageStreams && !loading;
  const isTagsAvailable =
    imageStream.tag !== '' || (isStreamsAvailable && !_.isEmpty(imageStreamTagList));
  const isImageStreamSelected = imageStream.image !== '';
  const showCommandLineAlert =
    project.name !== imageStream.namespace &&
    imageStream.namespace !== BuilderImagesNamespace.Openshift &&
    (registry === RegistryType.Internal || fromImageStreamTag) &&
    isStreamsAvailable &&
    isTagsAvailable;
  const helperTextInvalid = validated === ValidatedOptions.error && isi.status?.message && (
    <>
      <ExclamationCircleIcon />
      &nbsp;{isi.status?.message}
    </>
  );

  return (
    <>
      <ImageStreamContext.Provider
        value={{ state, dispatch, hasImageStreams, setHasImageStreams, setValidated }}
      >
        <FormGroup
          fieldId="image-stream-dropdowns"
          validated={validated}
          helperTextInvalid={helperTextInvalid}
          label={label}
          required={required}
          data-test={dataTest}
        >
          <div className="row">
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
              <ImageStreamNsDropdown disabled={disabled} formContextField={formContextField} />
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
              <ImageStreamDropdown disabled={disabled} formContextField={formContextField} />
              <div className="odc-imagestream-separator">/</div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
              <ImageStreamTagDropdown disabled={disabled} formContextField={formContextField} />
              <div className="odc-imagestream-separator">:</div>
            </div>
          </div>
        </FormGroup>
        {isNamespaceSelected && isImageStreamSelected && !isTagsAvailable && (
          <div className="odc-imagestream-alert">
            <Alert variant="warning" title={t('devconsole~No Image streams tags found')} isInline>
              {t('devconsole~No tags are available in Image Stream {{image}}', {
                image: imageStream.image,
              })}
            </Alert>
          </div>
        )}
        {isNamespaceSelected && !loading && !isStreamsAvailable && (
          <div className="odc-imagestream-alert">
            <Alert variant="warning" title={t('devconsole~No Image streams found')} isInline>
              {t('devconsole~No Image streams are available in Project {{namespace}}', {
                namespace: imageStream.namespace,
              })}
            </Alert>
          </div>
        )}
        {isNamespaceSelected && !accessLoading && showCommandLineAlert && (
          <div className="odc-imagestream-alert">
            <Alert
              variant="warning"
              isInline
              title={t(
                'devconsole~Service account default will need pull authority to deploy Images from {{namespace}}',
                { namespace: imageStream.namespace },
              )}
            >
              {t('devconsole~You can grant authority with the command')}{' '}
              <ClipboardCopy
                className="odc-imagestream-clipboard"
                variant={ClipboardCopyVariant.expansion}
                isReadOnly
              >{`oc policy add-role-to-user system:image-puller system:serviceaccount:${project.name}:default --namespace=${imageStream.namespace}`}</ClipboardCopy>
            </Alert>
          </div>
        )}
      </ImageStreamContext.Provider>
    </>
  );
};

export default React.memo(ImageStream);
