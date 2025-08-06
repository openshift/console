import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInputTypes,
} from '@patternfly/react-core';
import { FormikProps, FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { FormFooter, FormBody, InputField, FlexForm } from '@console/shared';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { PAC_GH_APP_DOC, PAC_GH_APP_NEW } from './const';
import PacPermissions from './PacPermissions';

const PacAppForm: React.FC<FormikProps<FormikValues>> = ({
  errors,
  handleReset,
  status,
  isSubmitting,
  values,
}) => {
  const { t } = useTranslation();
  const { setStatus } = useFormikContext<FormikValues>();
  const [manifestVal, setManifestVal] = React.useState<string>('');

  const submitFrom = (event: React.FormEvent<EventTarget>) => {
    if (!values.manifestData.hook_attributes.url) {
      setStatus({ submitError: t('pipelines-plugin~Unable to detect Event listener URL') });
      event.preventDefault();
    } else {
      const dataMn = JSON.stringify({ ...values.manifestData, name: values.applicationName });
      setManifestVal(dataMn);
    }
  };
  return (
    <FlexForm
      action={PAC_GH_APP_NEW}
      onSubmit={submitFrom}
      method="post"
      data-test="form-setup-github-app"
    >
      <FormBody flexLayout className="pf-v6-c-page__main-section">
        <FormSection>
          <FormGroup
            label={t('pipelines-plugin~GitHub application name')}
            isRequired
            fieldId="app-name-field"
          >
            <InputField
              type={TextInputTypes.text}
              name="applicationName"
              placeholder={t('pipelines-plugin~Enter name of application')}
              data-test="pac-applicationName"
              required
              aria-label={t('pipelines-plugin~Enter name of application')}
            />
            <input type="text" name="manifest" id="manifest" value={manifestVal} hidden />

            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t(
                    'pipelines-plugin~Provide a unique name for your GitHub app, e.g. "pipelines-ci-clustername"',
                  )}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <PacPermissions />
          <ExternalLink
            text={t('pipelines-plugin~View all steps in documentation')}
            href={PAC_GH_APP_DOC}
          />
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('pipelines-plugin~Setup')}
        disableSubmit={!_.isEmpty(errors) || isSubmitting || !!status?.submitError}
        resetLabel={t('pipelines-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default PacAppForm;
