import * as React from 'react';
import { Button, Popover, Title } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { VerticalTabs, VerticalTabsTab } from '@patternfly/react-catalog-view-extension';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { CatalogType } from '../utils/types';

interface CatalogTypeSelectorProps {
  catalogTypes: CatalogType[];
  onCatalogTypeChange: (type: string) => void;
}

const CatalogTypeSelector: React.FC<CatalogTypeSelectorProps> = ({
  catalogTypes,
  onCatalogTypeChange,
}) => {
  const typeDescriptions = React.useMemo(
    () =>
      catalogTypes.map((type) => <SyncMarkdownView key={type.value} content={type.description} />),
    [catalogTypes],
  );

  const info = (
    <Popover headerContent="Types" bodyContent={typeDescriptions}>
      <Button variant="link" isInline>
        <OutlinedQuestionCircleIcon className="co-catalog-page__info-icon" />
      </Button>
    </Popover>
  );

  return (
    <>
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
    </>
  );
};

export default CatalogTypeSelector;
