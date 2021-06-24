import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { SelectorInput } from '@console/internal/components/utils';
import FormSection from '../section/FormSection';

const LabelSection: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const labels = SelectorInput.arrayify(values.labels);

  return (
    <FormSection
      title={t('devconsole~Labels')}
      subTitle={t('devconsole~Each label is applied to each created resource.')}
    >
      <SelectorInput
        onChange={(val) => setFieldValue('labels', SelectorInput.objectify(val))}
        tags={labels}
        placeholder="app.io/type=frontend"
      />
    </FormSection>
  );
};

export default LabelSection;
