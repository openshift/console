import * as React from 'react';
import { Button, ButtonVariant, Content, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import { useTelemetry } from '../../hooks/useTelemetry';
import CatalogBadges from '../catalog/CatalogBadges';
import { handleCta } from './utils/quick-search-utils';

import './QuickSearchDetails.scss';

export type QuickSearchDetailsRendererProps = {
  selectedItem: CatalogItem;
  closeModal: () => void;
};
export type DetailsRendererFunction = (props: QuickSearchDetailsRendererProps) => React.ReactNode;
export interface QuickSearchDetailsProps extends QuickSearchDetailsRendererProps {
  detailsRenderer: DetailsRendererFunction;
}

const QuickSearchDetails: React.FC<QuickSearchDetailsProps> = ({
  selectedItem,
  closeModal,
  detailsRenderer,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  const defaultContentRenderer: DetailsRendererFunction = (
    props: QuickSearchDetailsProps,
  ): React.ReactNode => {
    return (
      <>
        <Title headingLevel="h4">{props.selectedItem.name}</Title>
        {props.selectedItem.provider && (
          <span className="ocs-quick-search-details__provider">
            {t('console-shared~Provided by {{provider}}', {
              provider: props.selectedItem.provider,
            })}
          </span>
        )}
        {selectedItem.badges?.length > 0 ? (
          <CatalogBadges badges={selectedItem.badges} />
        ) : undefined}
        <Button
          variant={ButtonVariant.primary}
          className="ocs-quick-search-details__form-button"
          data-test="create-quick-search"
          onClick={(e) => {
            handleCta(e, props.selectedItem, props.closeModal, fireTelemetryEvent);
          }}
        >
          {props.selectedItem.cta.label}
        </Button>
        <Content className="ocs-quick-search-details__description">
          {props.selectedItem.description}
        </Content>
      </>
    );
  };
  const detailsContentRenderer: DetailsRendererFunction = detailsRenderer ?? defaultContentRenderer;

  return (
    <div className="ocs-quick-search-details">
      {detailsContentRenderer({ selectedItem, closeModal })}
    </div>
  );
};

export default QuickSearchDetails;
