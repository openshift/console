import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { Button, ButtonVariant, TextContent, Title } from '@patternfly/react-core';
import './QuickSearchDetails.scss';

interface QuickSearchDetailsProps {
  selectedItem: CatalogItem;
}

const QuickSearchDetails: React.FC<QuickSearchDetailsProps> = ({ selectedItem }) => {
  const { t } = useTranslation();

  return (
    <div className="odc-quick-search-details">
      <Title headingLevel="h4">{selectedItem.name}</Title>
      {selectedItem.provider && (
        <span className="odc-quick-search-details__provider">
          {t('topology~Provided by {{provider}}', { provider: selectedItem.provider })}
        </span>
      )}
      <Button
        variant={ButtonVariant.primary}
        className="odc-quick-search-details__form-button"
        onClick={() => {
          const { href, callback } = selectedItem.cta;
          callback ? callback() : history.push(href);
        }}
      >
        {selectedItem.cta.label}
      </Button>
      <TextContent className="odc-quick-search-details__description">
        {selectedItem.description}
      </TextContent>
    </div>
  );
};

export default QuickSearchDetails;
