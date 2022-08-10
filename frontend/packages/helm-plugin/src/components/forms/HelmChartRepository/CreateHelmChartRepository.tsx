import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { k8sCreateResource, k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import { history, StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  K8sResourceKindReference,
  kindForReference,
  modelFor,
  referenceFor,
} from '@console/internal/module/k8s';
import { useActiveNamespace, useQueryParams } from '@console/shared/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../models';
import { HelmChartRepositoryData, HelmChartRepositoryType } from '../../../types/helm-types';
import CreateHelmChartRepositoryForm from './CreateHelmChartRepositoryForm';
import {
  getDefaultResource,
  convertToForm,
  convertToHelmChartRepository,
} from './helmchartrepository-create-utils';
import { validationSchema } from './helmchartrepository-validation-utils';

interface CreateHelmChartRepositoryProps {
  showScopeType: boolean;
  existingRepoName: string;
}

const CreateHelmChartRepository: React.FC<CreateHelmChartRepositoryProps> = ({
  showScopeType,
  existingRepoName,
}) => {
  const queryParams = useQueryParams();
  const resourceKind: K8sResourceKindReference = queryParams.get('kind');
  const isEditForm = !!existingRepoName;
  const actionOrigin = queryParams.get('actionOrigin');
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const fireTelemetryEvent = useTelemetry();
  const [hcr, hcrLoaded, hcrLoadError] = useK8sWatchResource<HelmChartRepositoryType>(
    isEditForm
      ? {
          groupVersionKind: {
            group: 'helm.openshift.io',
            version: 'v1beta1',
            kind: resourceKind ? kindForReference(resourceKind) : HelmChartRepositoryModel.kind,
          },
          name: existingRepoName,
          ...(resourceKind &&
          kindForReference(resourceKind) === ProjectHelmChartRepositoryModel.kind
            ? { namespace }
            : {}),
        }
      : null,
  );

  const defaultResource: HelmChartRepositoryType = React.useMemo(
    () =>
      hcrLoaded && _.isEmpty(hcrLoadError) && !_.isEmpty(hcr)
        ? hcr
        : getDefaultResource(namespace, resourceKind),
    [hcrLoadError, hcrLoaded, hcr, namespace, resourceKind],
  );

  const initialValues = React.useMemo(
    () => ({
      editorType: EditorType.Form,
      yamlData: safeJSToYAML(isEditForm ? hcr : defaultResource, 'yamlData', {
        skipInvalid: true,
      }),
      formData: convertToForm(isEditForm ? hcr : defaultResource),
    }),
    [isEditForm, hcr, defaultResource],
  );

  const handleSubmit = async (
    values: HelmChartRepositoryData,
    actions: FormikHelpers<HelmChartRepositoryData>,
  ) => {
    let HelmChartRepositoryRes: HelmChartRepositoryType;

    if (values.editorType === EditorType.YAML) {
      try {
        HelmChartRepositoryRes = safeLoad(values.yamlData);
        if (
          HelmChartRepositoryRes &&
          HelmChartRepositoryRes.kind === 'ProjectHelmChartRepository' &&
          !HelmChartRepositoryRes?.metadata?.namespace
        ) {
          HelmChartRepositoryRes.metadata.namespace = namespace;
        }
      } catch (err) {
        actions.setStatus({
          submitSuccess: '',
          submitError: t('helm-plugin~Invalid YAML - {{err}}', { err }),
        });
        return null;
      }
    } else {
      HelmChartRepositoryRes = convertToHelmChartRepository(values.formData, namespace);
    }

    const resourceCall = isEditForm
      ? k8sUpdateResource({
          model: modelFor(referenceFor(HelmChartRepositoryRes)),
          data: HelmChartRepositoryRes,
          name: existingRepoName,
        })
      : k8sCreateResource({
          model: modelFor(referenceFor(HelmChartRepositoryRes)),
          data: HelmChartRepositoryRes,
        });

    const redirectURL = actionOrigin
      ? `/catalog/ns/${HelmChartRepositoryRes.metadata.namespace ??
          namespace}?catalogType=HelmChart`
      : HelmChartRepositoryRes.kind === ProjectHelmChartRepositoryModel.kind
      ? `/k8s/ns/${HelmChartRepositoryRes.metadata.namespace}/${referenceFor(
          HelmChartRepositoryRes,
        )}/${HelmChartRepositoryRes.metadata.name}`
      : `/k8s/cluster/${referenceFor(HelmChartRepositoryRes)}/${
          HelmChartRepositoryRes.metadata.name
        }`;

    return resourceCall
      .then(() => {
        fireTelemetryEvent('Helm Chart Repository', {
          helmChartRepositoryScope:
            values.formData?.scope === ProjectHelmChartRepositoryModel.kind
              ? 'namespace'
              : 'cluster',
        });
        actions.setStatus({
          submitError: '',
          submitSuccess: t('helm-plugin~{{hcr}} has been created', {
            hcr: HelmChartRepositoryRes.kind,
          }),
        });
        history.push(redirectURL);
      })
      .catch((err) => {
        actions.setStatus({
          submitSuccess: '',
          submitError: err?.message || t('helm-plugin~Unknown error submitting'),
        });
      });
  };

  const handleCancel = () => history.goBack();

  if (isEditForm && hcrLoaded && !hcr) {
    return <ErrorPage404 />;
  }

  return (
    <StatusBox
      loaded={hcrLoaded}
      loadError={hcrLoadError}
      data={initialValues}
      label={defaultResource.kind}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema(t)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formikProps) => {
          return (
            <CreateHelmChartRepositoryForm
              {...formikProps}
              namespace={namespace}
              handleCancel={handleCancel}
              showScopeType={showScopeType}
              existingRepo={existingRepoName && hcr}
            />
          );
        }}
      </Formik>
    </StatusBox>
  );
};

export default CreateHelmChartRepository;
