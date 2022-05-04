import * as React from 'react';
import { Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { history } from '@console/internal/components/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { ProjectHelmChartRepositoryModel } from '../../../models';
import { ProjectHelmChartRepositoryType } from '../../../types/helm-types';
import CreateProjectHelmChartRepositoryForm from './CreateProjectHelmChartRepositoryForm';
import {
  convertToForm,
  convertToProjectHelmChartRepository,
} from './projecthelmchartrepository-create-utils';
import { validationSchema } from './projecthelmchartrepository-validation-utils';

export interface CreateProjectHelmChartRepositoryProps {
  resource: ProjectHelmChartRepositoryType;
  namespace: string;
}

const CreateProjectHelmChartRepository: React.FC<CreateProjectHelmChartRepositoryProps> = ({
  resource,
  namespace,
}) => {
  const { t } = useTranslation();

  const initialValues = React.useRef({
    editorType: EditorType.Form,
    yamlData: safeJSToYAML(resource, 'yamlData', {
      skipInvalid: true,
    }),
    formData: convertToForm(resource),
  });

  const handleSubmit = (values, actions) => {
    let projectHelmChartRepositoryRes: ProjectHelmChartRepositoryType;

    if (values.editorType === EditorType.YAML) {
      try {
        projectHelmChartRepositoryRes = safeLoad(values.yamlData);
        if (!projectHelmChartRepositoryRes?.metadata?.namespace) {
          projectHelmChartRepositoryRes.metadata.namespace = namespace;
        }
      } catch (err) {
        actions.setStatus({
          submitSuccess: '',
          submitError: t('helm-plugin~Invalid YAML - {{err}}', { err }),
        });
        return null;
      }
    } else {
      projectHelmChartRepositoryRes = convertToProjectHelmChartRepository(
        values.formData,
        namespace,
      );
    }

    const resourceCall = k8sCreateResource({
      model: ProjectHelmChartRepositoryModel,
      data: projectHelmChartRepositoryRes,
    });

    return resourceCall
      .then(() => {
        actions.setStatus({
          submitError: '',
          submitSuccess: t('helm-plugin~ProjectHelmChartRepository has been created'),
        });
        history.push(`/catalog/ns/${namespace}?catalogType=HelmChart`);
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
          <CreateProjectHelmChartRepositoryForm
            {...formikProps}
            resource={resource}
            handleCancel={handleCancel}
          />
        );
      }}
    </Formik>
  );
};

export default CreateProjectHelmChartRepository;
