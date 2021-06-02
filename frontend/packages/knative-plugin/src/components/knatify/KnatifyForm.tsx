import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import AdvancedSection from '@console/dev-console/src/components/import/advanced/AdvancedSection';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import ImageSearchSection from '@console/dev-console/src/components/import/image-search/ImageSearchSection';
import { DeployImageFormProps } from '@console/dev-console/src/components/import/import-types';
import IconSection from '@console/dev-console/src/components/import/section/IconSection';
import { usePreventDataLossLock } from '@console/internal/components/utils';
import { FormFooter, FlexForm, FormBody } from '@console/shared/src/components/form-utils';

const KnatifyForm: React.FC<FormikProps<FormikValues> & DeployImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  projects,
}) => {
  const { t } = useTranslation();
  usePreventDataLossLock(isSubmitting);

  return (
    <FlexForm className="co-deploy-image" data-test-id="knatify-form" onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <ImageSearchSection disabled />
        <IconSection />
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
        <AdvancedSection values={values} />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('knative-plugin~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('knative-plugin~Cancel')}
      />
    </FlexForm>
  );
};

export default KnatifyForm;
