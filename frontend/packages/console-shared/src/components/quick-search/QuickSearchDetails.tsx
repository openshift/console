import type { ReactNode, FC } from 'react';
import { Button, ButtonVariant, Content, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import { useQueryParamsMutator } from '@console/internal/components/utils/router';
import { useTelemetry } from '../../hooks/useTelemetry';
import CatalogBadges from '../catalog/CatalogBadges';
import { handleCta } from './utils/quick-search-utils';

import './QuickSearchDetails.scss';

export type QuickSearchDetailsRendererProps = {
  selectedItem: CatalogItem;
  closeModal: () => void;
  navigate: (url: string) => void;
  removeQueryArgument: (key: string) => void;
};
export type DetailsRendererFunction = (props: QuickSearchDetailsRendererProps) => ReactNode;
export interface QuickSearchDetailsProps {
  selectedItem: CatalogItem;
  closeModal: () => void;
  detailsRenderer?: DetailsRendererFunction;
}

const QuickSearchDetails: FC<QuickSearchDetailsProps> = ({
  selectedItem,
  closeModal,
  detailsRenderer,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { removeQueryArgument } = useQueryParamsMutator();
  const fireTelemetryEvent = useTelemetry();

  const defaultContentRenderer = (): ReactNode => {
    return (
      <>
        <Title headingLevel="h4">{selectedItem.name}</Title>
        {selectedItem.provider && (
          <span className="ocs-quick-search-details__provider">
            {t('console-shared~Provided by {{provider}}', {
              provider: selectedItem.provider,
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
            handleCta(
              e,
              selectedItem,
              closeModal,
              fireTelemetryEvent,
              navigate,
              removeQueryArgument,
            );
          }}
        >
          {selectedItem.cta.label}
        </Button>
        <Content className="ocs-quick-search-details__description">
          {selectedItem.description}
        </Content>
      </>
    );
  };

  return (
    <div className="ocs-quick-search-details">
      {detailsRenderer
        ? detailsRenderer({ selectedItem, closeModal, navigate, removeQueryArgument })
        : defaultContentRenderer()}
    </div>
  );
};

export default QuickSearchDetails;
