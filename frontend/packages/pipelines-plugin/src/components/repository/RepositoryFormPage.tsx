import * as React from 'react';
import { Formik, FormikBag } from 'formik';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { history } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RepositoryModel } from '../../models';
import { defaultRepositoryFormValues } from './consts';
import { createRepositoryResources, repositoryValidationSchema } from './repository-form-utils';
import { RepositoryForm } from './RepositoryForm';
import { RepositoryFormValues } from './types';

type RepositoryFormPageProps = RouteComponentProps<{ ns?: string }>;

const RepositoryFormPage: React.FC<RepositoryFormPageProps> = ({
  match: {
    params: { ns },
  },
}) => {
  const { t } = useTranslation();

  const handleSubmit = async (
    values: RepositoryFormValues,
    actions: FormikBag<any, RepositoryFormValues>,
  ) => {
    try {
      const repository = await createRepositoryResources(
        values.name,
        ns,
        values.gitUrl,
        values.accessToken,
      );
      history.push(
        `/k8s/ns/${ns}/${referenceForModel(RepositoryModel)}/${repository.metadata.name}`,
      );
    } catch (e) {
      actions.setStatus({ submitError: e.message });
    }
  };

  return (
    <Formik
      initialValues={defaultRepositoryFormValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={repositoryValidationSchema(t)}
    >
      {(formikProps) => <RepositoryForm {...formikProps} />}
    </Formik>
  );
};

export default RepositoryFormPage;
