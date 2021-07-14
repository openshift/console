import * as React from 'react';
import { Button, ButtonVariant, TextContent, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import './QuickSearchDetails.scss';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { handleCta } from './utils/quick-search-utils';

interface QuickSearchDetailsProps {
  selectedItem: CatalogItem;
  closeModal: () => void;
}

const QuickSearchDetails: React.FC<QuickSearchDetailsProps> = ({ selectedItem, closeModal }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  return (
    <div className="odc-quick-search-details">
      <Title headingLevel="h4">{selectedItem.name}</Title>
      {selectedItem.provider && (
        <span className="odc-quick-search-details__provider">
          {t('console-shared~Provided by {{provider}}', { provider: selectedItem.provider })}
        </span>
      )}
      <Button
        variant={ButtonVariant.primary}
        className="odc-quick-search-details__form-button"
        onClick={(e) => {
          handleCta(e, selectedItem, closeModal, fireTelemetryEvent);
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
