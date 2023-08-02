import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { useAccessReviewAllowed } from '@console/dynamic-plugin-sdk/src';
import { k8sCreateResource, k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { RouteModel, ServiceModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel, RouteKind } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML, safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { baseTemplates } from '../../models/yaml-templates';
import { RouteForm } from './RouteForm';
import { useTranslation } from 'react-i18next';
import { convertEditFormToRoute, convertRouteToEditForm, routeValidationSchema } from './utils';
import { RouteFormProps } from './create-route';

type RouteFormValues = {
  editorType: EditorType;
  formData: RouteFormProps;
  yamlData: string;
};

const defaultRouteYAML = baseTemplates.get(referenceForModel(RouteModel)).get('default');

export const RoutePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ns: namespace, name } = useParams();
  const isEditForm = !!name;
  const heading = isEditForm ? t('public~Edit Route') : t('public~Create Route');
  const submitLabel = isEditForm ? t('public~Save') : t('public~Create');

  const [route, routeLoaded, routeLoadError] = useK8sWatchResource<RouteKind>({
    kind: RouteModel.kind,
    name,
    namespace,
  });
  const [services, servicesLoaded, serviceLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: ServiceModel.kind,
    namespace,
    isList: true,
  });
  const loaded = routeLoaded && servicesLoaded;

  const canUpdateHost = useAccessReviewAllowed({
    group: RouteModel.apiGroup,
    resource: 'routes/custom-host',
    verb: 'update',
    name,
    namespace,
  });

  const initialValues = React.useMemo(
    () => ({
      editorType: EditorType.Form,
      yamlData: isEditForm
        ? safeJSToYAML(route, 'yamlData', {
            skipInvalid: true,
          })
        : defaultRouteYAML,
      formData: isEditForm ? convertRouteToEditForm(services, route) : {},
    }),
    [isEditForm, route, services],
  );

  const handleSubmit = async (values: RouteFormValues, helpers: FormikHelpers<RouteFormValues>) => {
    const data: RouteKind =
      values.editorType === EditorType.Form
        ? convertEditFormToRoute(values.formData, isEditForm && route)
        : safeYAMLToJS(values.yamlData);

    if (data?.metadata && !data.metadata.namespace) {
      data.metadata.namespace = namespace;
    }

    if (!canUpdateHost && isEditForm && data.spec.host !== route.spec.host) {
      helpers.setStatus({
        submitSuccess: '',
        submitError: t('public~Insufficient permissions to update host.'),
      });
      return null;
    }

    let resource: RouteKind;
    try {
      if (isEditForm) {
        resource = await k8sUpdateResource({ model: RouteModel, data, name });
      } else {
        resource = await k8sCreateResource({ model: RouteModel, data });
      }
      navigate(`/k8s/ns/${resource.metadata.namespace}/routes/${resource.metadata.name}`);
    } catch (e) {
      helpers.setStatus({
        submitSuccess: '',
        submitError: e?.message || t('public~Unknown error submitting'),
      });
    }

    return resource;
  };

  const handleCancel = () => navigate(-1);

  if (isEditForm && loaded && !route) {
    return <ErrorPage404 />;
  }

  return (
    <StatusBox loaded={loaded} loadError={routeLoadError || serviceLoadError} data={initialValues}>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={routeValidationSchema}
        enableReinitialize
      >
        {(formikProps) => (
          <RouteForm
            {...formikProps}
            heading={heading}
            handleCancel={handleCancel}
            submitLabel={submitLabel}
            services={services}
            existingRoute={name && route}
          />
        )}
      </Formik>
    </StatusBox>
  );
};
