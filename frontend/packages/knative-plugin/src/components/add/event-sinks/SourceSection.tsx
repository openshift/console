import * as React from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import SourceResources from './form-fields/SourceResources';

interface SourceSectionProps {
  namespace: string;
  fullWidth?: boolean;
}

const SourceSection: React.FC<SourceSectionProps> = ({ namespace, fullWidth }) => {
  const { t } = useTranslation();
  return (
    <FormSection
      title={
        <>
          {t('knative-plugin~Source')}
          <span
            className="pf-c-form__label-required"
            aria-hidden="true"
            style={{ verticalAlign: 'top' }}
          >
            {' *'}
          </span>
        </>
      }
      subTitle={t('knative-plugin~Add a source to route cloud events for the Event sink.')}
      extraMargin
      fullWidth={fullWidth}
    >
      <SourceResources namespace={namespace} />
    </FormSection>
  );
};

export default SourceSection;
