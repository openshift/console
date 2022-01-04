import * as React from 'react';
import { useTranslation } from 'react-i18next';
import SelectorInputField from '@console/shared/src/components/formik-fields/SelectorInputField';
import FormSection from '../section/FormSection';

const LabelSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t('devconsole~Labels')}
      subTitle={t('devconsole~Each label is applied to each created resource.')}
    >
      <SelectorInputField name="labels" placeholder="app.io/type=frontend" dataTest="labels" />
    </FormSection>
  );
};

export default LabelSection;
