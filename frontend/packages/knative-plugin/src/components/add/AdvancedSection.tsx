import * as React from 'react';
import ResourceLimitSection from '@console/dev-console/src/components/import/advanced/ResourceLimitSection';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import ProgressiveList from '@console/dev-console/src/components/progressive-list/ProgressiveList';
import ProgressiveListItem from '@console/dev-console/src/components/progressive-list/ProgressiveListItem';

const AdvancedSection: React.FC = () => {
  const [visibleItems, setVisibleItems] = React.useState([]);
  const handleVisibleItemChange = (item: string) => {
    setVisibleItems([...visibleItems, item]);
  };

  return (
    <FormSection title="Advanced Options" fullWidth extraMargin>
      <ProgressiveList
        text="Click on the names to access advanced options for"
        visibleItems={visibleItems}
        onVisibleItemChange={handleVisibleItemChange}
      >
        <ProgressiveListItem name="Resource Limits">
          <ResourceLimitSection />
        </ProgressiveListItem>
      </ProgressiveList>
    </FormSection>
  );
};

export default AdvancedSection;
