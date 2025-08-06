import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { history, LoadingBox } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PAC_GH_APP_NAME } from './const';
import { usePacGHManifest } from './hooks/usePacGHManifest';
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
      <DocumentTitle>{t('pipelines-plugin~Setup GitHub App')}</DocumentTitle>
      <PageHeading
        title={t('pipelines-plugin~Setup GitHub App')}
        breadcrumbs={[
          {
            name: t('pipelines-plugin~Pipelines'),
            path: `/pipelines/ns/${namespace}`,
          },
          { name: t('pipelines-plugin~Setup GitHub App'), path: undefined },
        ]}
      />
      <Formik
        initialValues={{ applicationName: PAC_GH_APP_NAME, manifestData }}
        onSubmit={() => {}}
        onReset={() => history.go(-1)}
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
