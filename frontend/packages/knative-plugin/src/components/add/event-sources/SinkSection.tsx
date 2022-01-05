import * as React from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import SinkUriResourcesGroup from './form-fields/SinkUriResourcesGroup';

interface SinkSectionProps {
  namespace: string;
  fullWidth?: boolean;
}

const SinkSection: React.FC<SinkSectionProps> = ({ namespace, fullWidth }) => {
  const { t } = useTranslation();
  return (
    <FormSection
      title={
        <>
          {t('knative-plugin~Sink')}
          <span
            className="pf-c-form__label-required"
            aria-hidden="true"
            style={{ verticalAlign: 'top' }}
          >
            {' *'}
          </span>
        </>
      }
      subTitle={t(
        'knative-plugin~Add a sink to route this Event source to a Channel, Broker, Knative Service or another route.',
      )}
      extraMargin
      fullWidth={fullWidth}
    >
      <SinkUriResourcesGroup namespace={namespace} />
    </FormSection>
  );
};

export default SinkSection;
