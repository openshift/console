import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ScalingSection from '../import/advanced/ScalingSection';
import FormSection from '../import/section/FormSection';
import ProgressiveList from '../progressive-list/ProgressiveList';
import ProgressiveListItem from '../progressive-list/ProgressiveListItem';
import PauseRolloutsSection from './PauseRolloutsSection';

type AdvancedSectionProps = {
  resourceType: string;
};

const List: React.FC<AdvancedSectionProps> = ({ resourceType }) => {
  const { t } = useTranslation();
  const [visibleItems, setVisibleItems] = React.useState<string[]>([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList visibleItems={visibleItems} onVisibleItemChange={handleVisibleItemChange}>
      <ProgressiveListItem name={t('devconsole~Pause rollouts')}>
        <PauseRolloutsSection name="formData.paused" resourceType={resourceType} />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('devconsole~Scaling')}>
        <ScalingSection name="formData.replicas" />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ resourceType }) => {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t('devconsole~Advanced options')}
      dataTest="advanced-options-section"
      fullWidth
    >
      <div>
        <Trans ns="devconsole">
          Click on the names to access advanced options for <List resourceType={resourceType} />.
        </Trans>
      </div>
    </FormSection>
  );
};

export default AdvancedSection;
