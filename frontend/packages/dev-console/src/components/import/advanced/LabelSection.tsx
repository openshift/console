import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectorInputField } from '@console/shared/src/components/formik-fields/SelectorInputField';
import FormSection from '../section/FormSection';

const LabelSection: FC = () => {
  const { t } = useTranslation('devconsole');

  return (
    <FormSection
      title={t('Labels')}
      subTitle={t('Each label is applied to each created resource.')}
    >
      <SelectorInputField name="labels" placeholder="app.io/type=frontend" dataTest="labels" />
    </FormSection>
  );
};

export default LabelSection;
