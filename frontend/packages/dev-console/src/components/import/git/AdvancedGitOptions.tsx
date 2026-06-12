import type { FC, SyntheticEvent } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { useDebounceCallback } from '@console/shared/src/hooks/useDebounceCallback';
import FormSection from '../section/FormSection';
import SourceSecretSelector from './SourceSecretSelector';

const AdvancedGitOptions: FC<{
  formContextField?: string;
}> = ({ formContextField }) => {
  const fieldPrefix = formContextField ? `${formContextField}.` : '';

  const { t } = useTranslation('devconsole');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();

  const handleGitRefChange = useDebounceCallback((e: SyntheticEvent) =>
    setFieldValue(`${fieldPrefix}git.ref`, (e.target as HTMLInputElement).value),
  );

  const handleGitDirChange = useDebounceCallback((e: SyntheticEvent) => {
    setFieldValue(`${fieldPrefix}git.dir`, (e.target as HTMLInputElement).value);
    setFieldTouched(`${fieldPrefix}git.dir`);
  });

  return (
    <ExpandCollapse
      textExpanded={t('Hide advanced Git options')}
      textCollapsed={t('Show advanced Git options')}
      dataTest="advanced-git-options"
    >
      <FormSection>
        <InputField
          type={TextInputTypes.text}
          name={`${fieldPrefix}git.ref`}
          label={t('Git reference')}
          helpText={t('Optional branch, tag, or commit.')}
          onChange={handleGitRefChange}
        />
        <InputField
          type={TextInputTypes.text}
          name={`${fieldPrefix}git.dir`}
          label={t('Context dir')}
          helpText={t(
            'devconsole~Optional subdirectory for the source code, used as a context directory for build.',
          )}
          onChange={handleGitDirChange}
        />
        <SourceSecretSelector formContextField={formContextField} />
      </FormSection>
    </ExpandCollapse>
  );
};

export default AdvancedGitOptions;
