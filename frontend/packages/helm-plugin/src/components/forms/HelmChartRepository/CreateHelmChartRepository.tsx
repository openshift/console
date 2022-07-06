import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { history } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { ProjectHelmChartRepositoryModel } from '../../../models';
import { HelmChartRepositoryData, HelmChartRepositoryType } from '../../../types/helm-types';
import CreateHelmChartRepositoryForm from './CreateHelmChartRepositoryForm';
import { convertToForm, convertToHelmChartRepository } from './helmchartrepository-create-utils';
import { validationSchema } from './helmchartrepository-validation-utils';

interface CreateHelmChartRepositoryProps {
  resource: HelmChartRepositoryType;
  showScopeType: boolean;
  actionOrigin?: string;
}

const CreateHelmChartRepository: React.FC<CreateHelmChartRepositoryProps> = ({
  resource,
  actionOrigin,
  showScopeType,
}) => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();

  const initialValues = React.useRef({
    editorType: EditorType.Form,
    yamlData: safeJSToYAML(resource, 'yamlData', {
      skipInvalid: true,
    }),
    formData: convertToForm(resource),
  });

  const handleSubmit = (
    values: HelmChartRepositoryData,
    actions: FormikHelpers<HelmChartRepositoryData>,
  ) => {
    let HelmChartRepositoryRes: HelmChartRepositoryType;

    if (values.editorType === EditorType.YAML) {
      try {
        HelmChartRepositoryRes = safeLoad(values.yamlData);
        if (HelmChartRepositoryRes && !HelmChartRepositoryRes.metadata?.namespace) {
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

    const resourceCall = k8sCreateResource({
      model: modelFor(referenceFor(HelmChartRepositoryRes)),
      data: HelmChartRepositoryRes,
    });

    const redirectURL = actionOrigin
      ? HelmChartRepositoryRes.kind === ProjectHelmChartRepositoryModel.kind
        ? `/k8s/ns/${HelmChartRepositoryRes.metadata.namespace}/${referenceFor(
            HelmChartRepositoryRes,
          )}/${HelmChartRepositoryRes.metadata.name}`
        : `/k8s/cluster/${referenceFor(HelmChartRepositoryRes)}/${
            HelmChartRepositoryRes.metadata.name
          }`
      : `/catalog/ns/${HelmChartRepositoryRes.metadata.namespace ??
          namespace}?catalogType=HelmChart`;

    return resourceCall
      .then(() => {
        actions.setStatus({
          submitError: '',
          submitSuccess: t('helm-plugin~{{hcr}} has been created', {
            hcr: HelmChartRepositoryRes.kind,
          }),
        });
        history.push(redirectURL);
      })
      .catch((err) => {
        actions.setStatus({ submitSuccess: '', submitError: err.message });
      });
  };

  const handleCancel = () => history.goBack();

  return (
    <Formik
      initialValues={initialValues.current}
      validationSchema={validationSchema(t)}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {(formikProps) => {
        return (
          <CreateHelmChartRepositoryForm
            {...formikProps}
            resource={resource}
            namespace={namespace}
            handleCancel={handleCancel}
            showScopeType={showScopeType}
          />
        );
      }}
    </Formik>
  );
};

export default CreateHelmChartRepository;
