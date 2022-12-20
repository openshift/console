import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FlexForm, FormFooter, FormBody } from '@console/shared';
import AdminNamespaceSection from './AdminNamespaceSection';
import CloudShellAdvancedOption from './CloudShellAdvancedOption';
import NamespaceSection from './NamespaceSection';

const CloudShellSetupForm: React.FC<Pick<
  FormikProps<FormikValues>,
  'errors' | 'handleSubmit' | 'handleReset' | 'status' | 'isSubmitting'
> & { isAdmin?: boolean }> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  isAdmin = false,
}) => {
  const { t } = useTranslation();
  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody className="co-m-pane__form">
        {isAdmin ? <AdminNamespaceSection /> : <NamespaceSection />}
        <CloudShellAdvancedOption />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('console-app~Start')}
        disableSubmit={!_.isEmpty(errors) || isSubmitting}
        resetLabel={t('console-app~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default CloudShellSetupForm;
