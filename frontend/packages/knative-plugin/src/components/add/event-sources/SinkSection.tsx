import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import SinkUriResourcesGroup from './form-fields/SinkUriResourcesGroup';

interface SinkSectionProps {
  namespace: string;
  fullWidth?: boolean;
}

const SinkSection: FC<SinkSectionProps> = ({ namespace, fullWidth }) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <FormSection
      title={
        <>
          {t('Target')}
          <span
            className="pf-v6-c-form__label-required"
            aria-hidden="true"
            style={{ verticalAlign: 'top' }}
          >
            {' *'}
          </span>
        </>
      }
      subTitle={t('Add a target to route cloud events from this Event source.')}
      extraMargin
      fullWidth={fullWidth}
    >
      <SinkUriResourcesGroup namespace={namespace} />
    </FormSection>
  );
};

export default SinkSection;
