import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceDropdownField } from '@console/shared';
import { getProjectResource, BuilderImagesNamespace } from '../../../utils/imagestream-utils';
import { ImageStreamActions as Action } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamNsDropdown: React.FC<{ disabled?: boolean; formContextField?: string }> = ({
  disabled = false,
  formContextField,
}) => {
  const { t } = useTranslation();
  const { values, setFieldValue, initialValues } = useFormikContext<FormikValues>();
  const { imageStream } = _.get(values, formContextField) || values;
  const { imageStream: initialImageStream, isi: initialIsi } =
    _.get(initialValues, formContextField) || initialValues;
  const { dispatch } = React.useContext(ImageStreamContext);
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const onDropdownChange = React.useCallback(() => {
    setFieldValue(`${fieldPrefix}imageStream.image`, initialImageStream.image);
    setFieldValue(`${fieldPrefix}imageStream.tag`, initialImageStream.tag);
    setFieldValue(`${fieldPrefix}isi`, initialIsi);
    dispatch({ type: Action.setLoading, value: true });
  }, [
    dispatch,
    fieldPrefix,
    initialImageStream.image,
    initialImageStream.tag,
    initialIsi,
    setFieldValue,
  ]);

  React.useEffect(() => {
    if (initialImageStream.image && imageStream.image !== initialImageStream.image) {
      initialImageStream.image = imageStream.image;
    }
    imageStream.namespace && onDropdownChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDropdownChange, imageStream.namespace]);

  React.useEffect(() => {
    if (initialImageStream.namespace !== imageStream.namespace) {
      initialImageStream.image = '';
      initialImageStream.tag = '';
    }
  }, [
    imageStream.namespace,
    initialImageStream.namespace,
    initialImageStream.image,
    initialImageStream.tag,
  ]);

  return (
    <ResourceDropdownField
      name={`${fieldPrefix}imageStream.namespace`}
      label={t('devconsole~Project')}
      title={t('devconsole~Select Project')}
      fullWidth
      required
      resources={getProjectResource()}
      dataSelector={['metadata', 'name']}
      onChange={onDropdownChange}
      appendItems={{ openshift: BuilderImagesNamespace.Openshift }}
      disabled={disabled}
    />
  );
};
export default ImageStreamNsDropdown;
