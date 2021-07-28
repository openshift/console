import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ScalingSection from '../import/advanced/ScalingSection';
import FormSection from '../import/section/FormSection';
import ProgressiveList from '../progressive-list/ProgressiveList';
import ProgressiveListItem from '../progressive-list/ProgressiveListItem';
import PauseRolloutsSection from './PauseRolloutsSection';

const AdvancedSection: React.FC<{ resourceType: string }> = ({ resourceType }) => {
  const { t } = useTranslation();
  const [visibleItems, setVisibleItems] = React.useState<string[]>([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };
  return (
    <FormSection
      title={t('devconsole~Advanced options')}
      dataTest="advanced-options-section"
      fullWidth
    >
      <ProgressiveList
        text={t('devconsole~Click on the names to access advanced options for')}
        visibleItems={visibleItems}
        onVisibleItemChange={handleVisibleItemChange}
      >
        <ProgressiveListItem name={t('devconsole~Pause rollouts')}>
          <PauseRolloutsSection name="formData.paused" resourceType={resourceType} />
        </ProgressiveListItem>
        <ProgressiveListItem name={t('devconsole~Scaling')}>
          <ScalingSection name="formData.replicas" />
        </ProgressiveListItem>
      </ProgressiveList>
    </FormSection>
  );
};

export default AdvancedSection;
