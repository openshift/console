import * as React from 'react';
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
      ns="console-app"
      defaults="Click on the names to access advanced options for <0></0>."
      components={[children]}
    />
  );
};

const List: React.FC = () => {
  const { t } = useTranslation();

  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <ProgressiveList
      visibleItems={visibleItems}
      onVisibleItemChange={handleVisibleItemChange}
      Footer={Footer}
    >
      <ProgressiveListItem name={t('console-app~Timeout')}>
        <TimeoutSection />
      </ProgressiveListItem>
      <ProgressiveListItem name={t('console-app~Image')}>
        <ImageSection />
      </ProgressiveListItem>
    </ProgressiveList>
  );
};

const CloudShellAdvancedSection: React.FC = () => {
  return (
    <FormSection style={{ marginTop: 0 }}>
      <div>
        <List />
      </div>
    </FormSection>
  );
};

export default CloudShellAdvancedSection;
