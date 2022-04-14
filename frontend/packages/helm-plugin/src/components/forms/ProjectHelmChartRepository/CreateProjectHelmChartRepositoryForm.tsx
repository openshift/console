import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ExpandCollapse, history } from '@console/internal/components/utils';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import {
  InputField,
  FormFooter,
  FormBody,
  FormHeader,
  FlexForm,
  ResourceDropdownField,
  CheckboxField,
} from '@console/shared';

const CreateProjectHelmChartRepositoryForm: React.FC<FormikProps<FormikValues>> = ({
  errors,
  handleSubmit,
  status,
  isSubmitting,
  dirty,
}) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody>
        <FormHeader
          title={t('helm-plugin~Create ProjectHelmChartRepository')}
          helpText={t('helm-plugin~Add helm chart repository in the namespace')}
        />
        <FormSection>
          <InputField
            type={TextInputTypes.text}
            name="repoName"
            label={t('helm-plugin~Chart repository name')}
            helpText={t('helm-plugin~A display name for the Helm Chart repository.')}
            required
          />
          <InputField
            type={TextInputTypes.text}
            name="repoDescription"
            label={t('helm-plugin~Description')}
            helpText={t('helm-plugin~A description for the Helm Chart repository.')}
          />
          <CheckboxField
            name="disabled"
            label={t('helm-plugin~Disable usage of the repo in the namespace')}
          />
          <InputField
            type={TextInputTypes.text}
            name="repoUrl"
            label={t('helm-plugin~URL')}
            helpText={t('helm-plugin~Helm Chart repository URL.')}
            required
          />
          <ExpandCollapse
            textExpanded={t('helm-plugin~Hide advanced options')}
            textCollapsed={t('helm-plugin~Show advanced options')}
          >
            <FormSection>
              <p className="pf-c-form__helper-text">
                {t(
                  'helm-plugin~Add credentials and custom certificate authority (CA) certificates to connect to private helm chart repository',
                )}
              </p>
              <ResourceDropdownField
                name="ca"
                label={t('helm-plugin~CA certificate')}
                resources={[
                  {
                    isList: true,
                    kind: ConfigMapModel.kind,
                    namespace: 'openshift-config',
                    optional: true,
                    prop: ConfigMapModel.id,
                  },
                ]}
                dataSelector={['metadata', 'name']}
                fullWidth
                placeholder={t('helm-plugin~Select ConfigMap')}
                showBadge
                autocompleteFilter={autocompleteFilter}
              />

              <ResourceDropdownField
                name="tlsClientConfig"
                label={t('helm-plugin~TLS Client config')}
                resources={[
                  {
                    isList: true,
                    kind: SecretModel.kind,
                    namespace: 'openshift-config',
                    optional: true,
                    prop: SecretModel.id,
                  },
                ]}
                dataSelector={['metadata', 'name']}
                fullWidth
                placeholder={t('helm-plugin~Select Secret')}
                showBadge
                autocompleteFilter={autocompleteFilter}
              />
            </FormSection>
          </ExpandCollapse>
        </FormSection>
      </FormBody>
      <FormFooter
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('helm-plugin~Create')}
        disableSubmit={!dirty || isSubmitting || !_.isEmpty(errors)}
        handleCancel={history.goBack}
      />
    </FlexForm>
  );
};

export default CreateProjectHelmChartRepositoryForm;
