import type { FC } from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressiveList } from '@console/shared/src/components/progressive-list/ProgressiveList';
import { ProgressiveListItem } from '@console/shared/src/components/progressive-list/ProgressiveListItem';
import ScalingSection from '../import/advanced/ScalingSection';
import FormSection from '../import/section/FormSection';
import PauseRolloutsSection from './PauseRolloutsSection';

type AdvancedSectionProps = {
  resourceType: string;
};

const Footer = ({ children }) => {
  const { t } = useTranslation('devconsole');
  return (
    <Trans
      t={t}
      ns="devconsole"
      defaults="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: FC<AdvancedSectionProps> = ({ resourceType }) => {
  const { t } = useTranslation('devconsole');
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
      Footer={Footer}
    >
      <ProgressiveListItem name={t('Pause rollouts')}>
        <PauseRolloutsSection name="formData.paused" resourceType={resourceType} />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('Scaling')}>
        <ScalingSection name="formData.replicas" />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const AdvancedSection: FC<AdvancedSectionProps> = ({ resourceType }) => {
  const { t } = useTranslation('devconsole');

  return (
    <FormSection title={t('Advanced options')} dataTest="advanced-options-section" fullWidth>
      <div data-test="deployment-form-testid">
        <List resourceType={resourceType} />
      </div>
    </FormSection>
  );
};

export default AdvancedSection;
