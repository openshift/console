import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router-dom';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { history } from '@console/internal/components/utils';
import { ProjectHelmChartRepositoryModel } from '../../../models';
import CreateProjectHelmChartRepositoryForm from './CreateProjectHelmChartRepositoryForm';
import { createProjectHelmChartRepositoryValidationSchema } from './projecthelmchartrepository-validation-utils';

type CreateProjectHelmChartRepositoryFormType = {
  repoName: string;
  repoUrl: string;
  repoDescription: string;
  ca: string;
  tlsClientConfig: string;
  disabled: boolean;
};

type CreateProjectHelmChartRepositoryPageProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

const CreateProjectHelmChartRepositoryPage: React.FC<CreateProjectHelmChartRepositoryPageProps> = ({
  match,
}) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const handleSubmit = (values, actions) => {
    const resourceObj = {
      apiVersion: 'helm.openshift.io/v1beta1',
      kind: ProjectHelmChartRepositoryModel.kind,
      metadata: {
        name: values.repoName,
        namespace,
      },
      spec: {
        connectionConfig: {
          url: values.repoUrl,
          ...(values.ca ? { ca: { name: values.ca } } : {}),
          ...(values.tlsClientConfig ? { tlsClientConfig: { name: values.tlsClientConfig } } : {}),
        },
        ...(values.repoDescription ? { description: values.repoDescription } : {}),
        ...(values.disabled ? { disabled: values.disabled } : {}),
        name: values.repoName,
      },
    };

    return k8sCreateResource({
      model: ProjectHelmChartRepositoryModel,
      data: resourceObj,
    })
      .then(() => {
        actions.setStatus({ submitError: '' });
        history.push(`/catalog/ns/${namespace}?catalogType=HelmChart`);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const initialValues: CreateProjectHelmChartRepositoryFormType = {
    repoName: '',
    ca: '',
    disabled: false,
    tlsClientConfig: '',
    repoDescription: '',
    repoUrl: '',
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createProjectHelmChartRepositoryValidationSchema(t)}
      onSubmit={handleSubmit}
      onReset={() => {}}
    >
      {(formikProps) => <CreateProjectHelmChartRepositoryForm {...formikProps} />}
    </Formik>
  );
};

export default CreateProjectHelmChartRepositoryPage;
