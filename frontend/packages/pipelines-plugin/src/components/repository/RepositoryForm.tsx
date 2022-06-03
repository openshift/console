import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { FormFooter, FlexForm, FormBody, useActiveNamespace } from '@console/shared';
import { RepositoryModel } from '../../models';
import RepositoryFormSection from './sections/RepositoryFormSection';
import RepositoryOverview from './sections/RepositoryOverview';
import { RepositoryFormValues } from './types';

import './RepositoryForm.scss';

type RepositoryFormProps = FormikProps<FormikValues & RepositoryFormValues>;

export const RepositoryForm: React.FC<RepositoryFormProps> = ({
  values,
  status,
  isSubmitting,
  dirty,
  handleReset,
  handleSubmit,
  errors,
}) => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const { showOverviewPage } = values;
  const onClose = () => {
    history.push(`/k8s/ns/${namespace}/${referenceForModel(RepositoryModel)}/${values.name}`);
  };
  return (
    <FlexForm onSubmit={handleSubmit} className="opp-repository-form">
      <FormBody className="opp-repository-form__body">
        {showOverviewPage ? <RepositoryOverview /> : <RepositoryFormSection />}
      </FormBody>
      <FormFooter
        handleSubmit={showOverviewPage ? onClose : null}
        handleReset={showOverviewPage ? null : handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={showOverviewPage ? t('pipelines-plugin~Close') : t('pipelines-plugin~Add')}
        disableSubmit={showOverviewPage ? false : !dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('pipelines-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};
