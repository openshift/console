import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import FormSection from '../section/FormSection';

interface BuildConfigSectionProps {
  showHeader?: boolean;
}

const BuildConfigSection: FC<BuildConfigSectionProps> = ({ showHeader }) => {
  const { t } = useTranslation('devconsole');
  const {
    values: { build },
  } = useFormikContext<FormikValues>();

  return (
    <FormSection title={showHeader && t('Build configuration')} extraMargin>
      {typeof build?.triggers?.webhook === 'boolean' && (
        <CheckboxField
          name="build.triggers.webhook"
          label={t('Configure a webhook build trigger')}
        />
      )}
      {typeof build?.triggers?.image === 'boolean' && (
        <CheckboxField
          name="build.triggers.image"
          label={t('Automatically build a new Image when the Builder Image changes')}
        />
      )}
      {typeof build?.triggers?.config === 'boolean' && (
        <CheckboxField
          name="build.triggers.config"
          label={t('Launch the first build when the build configuration is created')}
        />
      )}
    </FormSection>
  );
};

export default BuildConfigSection;
