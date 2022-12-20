import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressiveList, ProgressiveListItem } from '@console/shared/src';
import ScalingSection from '../import/advanced/ScalingSection';
import FormSection from '../import/section/FormSection';
import PauseRolloutsSection from './PauseRolloutsSection';

type AdvancedSectionProps = {
  resourceType: string;
};

const Footer = ({ children }) => {
  const { t } = useTranslation();
  return (
    <Trans
      t={t}
      ns="devconsole"
      defaults="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: React.FC<AdvancedSectionProps> = ({ resourceType }) => {
  const { t } = useTranslation();
  const [visibleItems, setVisibleItems] = React.useState<string[]>([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
      Footer={Footer}
    >
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
      <div data-test="edit-deployment-testid">
        <List resourceType={resourceType} />
      </div>
    </FormSection>
  );
};

export default AdvancedSection;
