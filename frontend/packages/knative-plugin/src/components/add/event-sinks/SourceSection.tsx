import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import SourceResources from './form-fields/SourceResources';

interface SourceSectionProps {
  namespace: string;
  fullWidth?: boolean;
}

const SourceSection: FC<SourceSectionProps> = ({ namespace, fullWidth }) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <FormSection
      title={
        <>
          {t('Source')}
          <span
            className="pf-v6-c-form__label-required"
            aria-hidden="true"
            style={{ verticalAlign: 'top' }}
          >
            {' *'}
          </span>
        </>
      }
      subTitle={t('Add a source to route cloud events for the Event sink.')}
      extraMargin
      fullWidth={fullWidth}
    >
      <SourceResources namespace={namespace} />
    </FormSection>
  );
};

export default SourceSection;
