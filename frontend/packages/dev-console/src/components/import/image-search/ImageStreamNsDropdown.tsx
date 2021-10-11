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
  const { isi: initialIsi } = _.get(initialValues, formContextField) || initialValues;
  const { dispatch } = React.useContext(ImageStreamContext);
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const onDropdownChange = React.useCallback(
    (ns?: string) => {
      if (ns) {
        setFieldValue(`${fieldPrefix}imageStream.image`, '');
        setFieldValue(`${fieldPrefix}imageStream.tag`, '');
      }
      setFieldValue(`${fieldPrefix}isi`, initialIsi);
      dispatch({ type: Action.setLoading, value: true });
    },
    [dispatch, fieldPrefix, initialIsi, setFieldValue],
  );

  React.useEffect(() => {
    imageStream.namespace && onDropdownChange();
  }, [onDropdownChange, imageStream.namespace]);

  return (
    <ResourceDropdownField
      name={`${fieldPrefix}imageStream.namespace`}
      label={t('devconsole~Project')}
      title={imageStream.namespace || t('devconsole~Select Project')}
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
