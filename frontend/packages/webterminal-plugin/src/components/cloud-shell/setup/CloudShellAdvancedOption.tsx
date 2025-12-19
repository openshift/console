import { useState } from 'react';
import { FormSection } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ProgressiveList, ProgressiveListItem } from '@console/shared/src';
import ImageSection from './ImageSection';
import TimeoutSection from './TimeoutSection';

const Footer = ({ children }) => {
  const { t } = useTranslation();
  return (
    <Trans
      t={t}
      ns="webterminal-plugin"
      defaults="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: Snail.FCC = () => {
  const { t } = useTranslation();

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
      <ProgressiveListItem name={t('webterminal-plugin~Timeout')}>
        <TimeoutSection />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('webterminal-plugin~Image')}>
        <ImageSection />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const CloudShellAdvancedSection: Snail.FCC = () => {
  return (
    <FormSection style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
      <div>
        <List />
      </div>
    </FormSection>
  );
};

export default CloudShellAdvancedSection;
