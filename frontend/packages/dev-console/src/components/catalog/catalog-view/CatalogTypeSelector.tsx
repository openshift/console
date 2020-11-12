import * as React from 'react';
import { Button, Popover, Title } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { VerticalTabs, VerticalTabsTab } from '@patternfly/react-catalog-view-extension';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

const CatalogTypeSelector = ({ catalogTypes, onCatalogTypeChange }) => {
  const typeDescriptions = React.useMemo(
    () => catalogTypes.map((type) => <SyncMarkdownView content={type.description} />),
    [catalogTypes],
  );

  const info = (
    <Popover headerContent="Types" bodyContent={typeDescriptions}>
      <Button variant="link" isInline>
        <OutlinedQuestionCircleIcon style={{ verticalAlign: 'middle' }} />
      </Button>
    </Popover>
  );

  return (
    <p>
      <Title headingLevel="h4" style={{ marginLeft: '14px' }}>
        Type {info}
      </Title>
      <VerticalTabs>
        {catalogTypes.map((type) => (
          <VerticalTabsTab
            key={type.value}
            title={`${type.label} (${type.numItems})`}
            onActivate={() => onCatalogTypeChange(type.value)}
          />
        ))}
      </VerticalTabs>
    </p>
  );
};

export default CatalogTypeSelector;
