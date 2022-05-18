import * as React from 'react';
import { Formik } from 'formik';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { history, LoadingBox, PageHeading } from '@console/internal/components/utils';
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
      <Helmet>
        <title>{t('pipelines-plugin~Setup GitHub App')}</title>
      </Helmet>
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
