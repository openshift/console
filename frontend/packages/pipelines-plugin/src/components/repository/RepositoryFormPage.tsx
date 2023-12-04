import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { history } from '@console/internal/components/utils';
import { defaultRepositoryFormValues } from './consts';
import { usePacInfo } from './hooks/pac-hook';
import {
  createRemoteWebhook,
  createRepositoryResources,
  repositoryValidationSchema,
} from './repository-form-utils';
import { RepositoryForm } from './RepositoryForm';
import { RepositoryFormValues } from './types';

const RepositoryFormPage: React.FC = () => {
  const { t } = useTranslation();
  const [pac, loaded] = usePacInfo();

  const { ns } = useParams();

  const handleSubmit = (values: RepositoryFormValues, actions): void => {
    createRepositoryResources(values, ns)
      .then(async () => {
        const isWebHookAttached = await createRemoteWebhook(values, pac, loaded);
        if (isWebHookAttached) {
          actions.setFieldValue('webhook.autoAttach', true);
        }

        actions.setFieldValue('showOverviewPage', true);
        actions.setStatus({
          submitError: '',
        });
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
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
