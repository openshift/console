import type { FC } from 'react';
import { useState } from 'react';
import { FormSection } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressiveList } from '@console/shared/src/components/progressive-list/ProgressiveList';
import { ProgressiveListItem } from '@console/shared/src/components/progressive-list/ProgressiveListItem';
import ImageSection from './ImageSection';
import TimeoutSection from './TimeoutSection';

const Footer = ({ children }) => {
  const { t } = useTranslation('webterminal-plugin');
  return (
    <Trans
      t={t}
      ns="webterminal-plugin"
      i18nKey="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: FC = () => {
  const { t } = useTranslation('webterminal-plugin');

  const [visibleItems, setVisibleItems] = useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
      Footer={Footer}
    >
      <ProgressiveListItem name={t('Timeout')}>
        <TimeoutSection />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('Image')}>
        <ImageSection />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const CloudShellAdvancedSection: FC = () => {
  return (
    <FormSection style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
      <div>
        <List />
      </div>
    </FormSection>
  );
};

export default CloudShellAdvancedSection;
