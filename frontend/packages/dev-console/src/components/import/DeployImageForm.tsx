import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { usePreventDataLossLock } from '@console/internal/components/utils';
import { FormFooter, FlexForm, FormBody } from '@console/shared/src/components/form-utils';
import { hasSampleQueryParameter } from '../../utils/samples';
import AdvancedSection from './advanced/AdvancedSection';
import AppSection from './app/AppSection';
import ImageSearchSection from './image-search/ImageSearchSection';
import { DeployImageFormProps } from './import-types';
import NamespaceSection from './NamespaceSection';
import { DeploySection } from './section/deploy-section/DeploySection';
import IconSection from './section/IconSection';

const DeployImageForm: React.FC<FormikProps<FormikValues> & DeployImageFormProps> = ({
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

  const isSample = hasSampleQueryParameter();
  const showAdvancedSections = !isSample;

  return (
    <FlexForm className="co-deploy-image" data-test-id="deploy-image-form" onSubmit={handleSubmit}>
      <FormBody>
        <ImageSearchSection />
        <NamespaceSection />
        <IconSection />
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
        {showAdvancedSections && (
          <>
            <DeploySection values={values} />
            <AdvancedSection values={values} />
          </>
        )}
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
      />
    </FlexForm>
  );
};

export default DeployImageForm;
