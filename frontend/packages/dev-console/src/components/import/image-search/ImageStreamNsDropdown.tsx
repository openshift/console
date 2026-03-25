import type { FC } from 'react';
import { useContext, useCallback, useEffect, useMemo } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceDropdownField } from '@console/shared';
import { BuilderImagesNamespace } from '../../../utils/imagestream-utils';
import { ImageStreamActions as Action } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamNsDropdown: FC<{
  disabled?: boolean;
  formContextField?: string;
  className?: string;
}> = ({ disabled = false, formContextField, className }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, initialValues } = useFormikContext<FormikValues>();
  const { imageStream } = _.get(values, formContextField) || values;
  const { isi: initialIsi } = _.get(initialValues, formContextField) || initialValues;
  const { dispatch } = useContext(ImageStreamContext);
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const onDropdownChange = useCallback(
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

  const watchedResources = useK8sWatchResources<{ projects: K8sResourceKind[] }>({
    projects: {
      isList: true,
      kind: referenceForModel(ProjectModel),
    },
  });

  const resources = useMemo(
    () => [
      {
        data: watchedResources.projects.data,
        loaded: watchedResources.projects.loaded,
        loadError: watchedResources.projects.loadError,
        kind: ProjectModel.kind,
      },
    ],
    [
      watchedResources.projects.data,
      watchedResources.projects.loaded,
      watchedResources.projects.loadError,
    ],
  );

  useEffect(() => {
    imageStream.namespace && onDropdownChange();
  }, [onDropdownChange, imageStream.namespace]);

  return (
    <ResourceDropdownField
      name={`${fieldPrefix}imageStream.namespace`}
      label={t('devconsole~Project')}
      title={imageStream.namespace || t('devconsole~Select Project')}
      fullWidth
      required
      resources={resources}
      dataSelector={['metadata', 'name']}
      onChange={onDropdownChange}
      appendItems={{ openshift: BuilderImagesNamespace.Openshift }}
      disabled={disabled}
      className={className}
    />
  );
};
export default ImageStreamNsDropdown;
