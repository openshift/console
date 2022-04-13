import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { history, LoadingBox, PageHeading } from '@console/internal/components/utils';
import { usePacGHManifest } from './hooks';
import { pacValidationSchema } from './pac-validation-schema';
import PacAppForm from './PacAppForm';

const PacForm: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const { loaded, manifestData } = usePacGHManifest();

  if (!loaded) {
    return <LoadingBox />;
  }

  return (
    <>
      <PageHeading
        title={t('pipelines-plugin~Configure Pipelines as Code')}
        breadcrumbs={[
          {
            name: t('pipelines-plugin~Pipelines'),
            path: `/pipelines/ns/${namespace}`,
          },
          { name: t('pipelines-plugin~Configure Pipelines as Code'), path: undefined },
        ]}
      />
      <Formik
        initialValues={{ applicationName: 'pac-app', manifestData }}
        onSubmit={() => {}}
        onReset={history.goBack}
        validateOnBlur={false}
        validateOnChange={false}
        validationSchema={pacValidationSchema(t)}
      >
        {(formikProps) => <PacAppForm {...formikProps} />}
      </Formik>
    </>
  );
};

export default PacForm;
