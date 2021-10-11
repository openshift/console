import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import { InputField, useDebounceCallback } from '@console/shared';
import FormSection from '../section/FormSection';
import SourceSecretSelector from './SourceSecretSelector';

const AdvancedGitOptions: React.FC<{
  formContextField?: string;
}> = ({ formContextField }) => {
  const fieldPrefix = formContextField ? `${formContextField}.` : '';

  const { t } = useTranslation();
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();

  const handleGitRefChange = useDebounceCallback((e: React.SyntheticEvent) =>
    setFieldValue(`${fieldPrefix}git.ref`, (e.target as HTMLInputElement).value),
  );

  const handleGitDirChange = useDebounceCallback((e: React.SyntheticEvent) => {
    setFieldValue(`${fieldPrefix}git.dir`, (e.target as HTMLInputElement).value);
    setFieldTouched(`${fieldPrefix}git.dir`);
  });

  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Hide advanced Git options')}
      textCollapsed={t('devconsole~Show advanced Git options')}
      dataTest="advanced-git-options"
    >
      <FormSection>
        <InputField
          type={TextInputTypes.text}
          name={`${fieldPrefix}git.ref`}
          label={t('devconsole~Git reference')}
          helpText={t('devconsole~Optional branch, tag, or commit.')}
          onChange={handleGitRefChange}
        />
        <InputField
          type={TextInputTypes.text}
          name={`${fieldPrefix}git.dir`}
          label={t('devconsole~Context dir')}
          helpText={t(
            'devconsole~Optional subdirectory for the Application source code, used as a context directory for build.',
          )}
          onChange={handleGitDirChange}
        />
        <SourceSecretSelector formContextField={formContextField} />
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedGitOptions;
