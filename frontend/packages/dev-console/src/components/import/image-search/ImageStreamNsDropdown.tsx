import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { ResourceDropdownField } from '@console/shared';
import { getProjectResource, BuilderImagesNamespace } from '../../../utils/imagestream-utils';
import { ImageStreamActions as Action } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamNsDropdown: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue, initialValues } = useFormikContext<FormikValues>();
  const { dispatch } = React.useContext(ImageStreamContext);
  const onDropdownChange = React.useCallback(() => {
    setFieldValue('imageStream.image', initialValues.imageStream.image);
    setFieldValue('imageStream.tag', initialValues.imageStream.tag);
    setFieldValue('isi', initialValues.isi);
    dispatch({ type: Action.setLoading, value: true });
  }, [
    dispatch,
    initialValues.imageStream.image,
    initialValues.imageStream.tag,
    initialValues.isi,
    setFieldValue,
  ]);

  React.useEffect(() => {
    if (
      initialValues.imageStream.image &&
      values.imageStream.image !== initialValues.imageStream.image
    ) {
      initialValues.imageStream.image = values.imageStream.image;
    }
    values.imageStream.namespace && onDropdownChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDropdownChange, values.imageStream.namespace]);

  React.useEffect(() => {
    if (initialValues.imageStream.namespace !== values.imageStream.namespace) {
      initialValues.imageStream.image = '';
      initialValues.imageStream.tag = '';
    }
  }, [
    initialValues.imageStream.image,
    initialValues.imageStream.namespace,
    initialValues.imageStream.tag,
    values.imageStream.namespace,
  ]);

  return (
    <ResourceDropdownField
      name="imageStream.namespace"
      label={t('devconsole~Project')}
      title={t('devconsole~Select Project')}
      fullWidth
      required
      resources={getProjectResource()}
      dataSelector={['metadata', 'name']}
      onChange={onDropdownChange}
      appendItems={{ openshift: BuilderImagesNamespace.Openshift }}
    />
  );
};
export default ImageStreamNsDropdown;
