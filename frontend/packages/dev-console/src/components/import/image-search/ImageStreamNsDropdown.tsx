import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { k8sGet } from '@console/internal/module/k8s';
import { RoleBindingModel } from '@console/internal/models';
import { checkAccess } from '@console/internal/components/utils';
import { ResourceDropdownField } from '@console/shared';
import { getProjectResource, BuilderImagesNamespace } from '../../../utils/imagestream-utils';
import { ImageStreamActions as Action } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';

const ImageStreamNsDropdown: React.FC = () => {
  const { values, setFieldValue, initialValues } = useFormikContext<FormikValues>();
  const { dispatch } = React.useContext(ImageStreamContext);
  const onDropdownChange = React.useCallback(
    (selectedProject: string) => {
      const promiseArr = [];
      setFieldValue('imageStream.image', initialValues.imageStream.image);
      setFieldValue('imageStream.tag', initialValues.imageStream.tag);
      setFieldValue('isi', initialValues.isi);
      dispatch({ type: Action.setLoading, value: true });
      dispatch({ type: Action.setAccessLoading, value: true });
      if (selectedProject === BuilderImagesNamespace.Openshift) {
        dispatch({ type: Action.setHasCreateAccess, value: true });
        dispatch({ type: Action.setHasAccessToPullImage, value: true });
        setFieldValue('imageStream.grantAccess', false);
      } else {
        promiseArr.push(
          checkAccess({
            group: RoleBindingModel.apiGroup,
            resource: RoleBindingModel.plural,
            verb: 'create',
            name: 'system:image-puller',
            namespace: values.project.name,
          })
            .then((resp) =>
              dispatch({ type: Action.setHasCreateAccess, value: resp.status.allowed }),
            )
            .catch(() => dispatch({ type: Action.setHasAccessToPullImage, value: false })),
        );
        promiseArr.push(
          k8sGet(RoleBindingModel, `system:image-puller-${selectedProject}`, values.project.name)
            .then(() => {
              dispatch({
                type: Action.setHasAccessToPullImage,
                value: true,
              });
              setFieldValue('imageStream.grantAccess', false);
            })
            .catch(() => dispatch({ type: Action.setHasAccessToPullImage, value: false })),
        );
      }
      return Promise.all(promiseArr).then(() =>
        dispatch({ type: Action.setAccessLoading, value: false }),
      );
    },
    [
      dispatch,
      initialValues.imageStream.image,
      initialValues.imageStream.tag,
      initialValues.isi,
      setFieldValue,
      values.project.name,
    ],
  );

  React.useEffect(() => {
    if (
      initialValues.imageStream.image &&
      values.imageStream.image !== initialValues.imageStream.image
    ) {
      initialValues.imageStream.image = values.imageStream.image;
    }
    values.imageStream.namespace && onDropdownChange(values.imageStream.namespace);
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
      label="Project"
      title="Select Project"
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
