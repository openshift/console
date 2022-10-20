import * as React from 'react';
import { VerticalTabs } from '@patternfly/react-catalog-view-extension';
import { Title, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '../../status/icons';
import { CatalogQueryParams, CatalogType, CatalogTypeCounts } from '../utils/types';

import './CatalogTypeSelector.scss';

interface CatalogTypeSelectorProps {
  catalogTypes: CatalogType[];
  catalogTypeCounts: CatalogTypeCounts;
}

const CatalogTypeSelector: React.FC<CatalogTypeSelectorProps> = ({
  catalogTypes,
  catalogTypeCounts,
}) => {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();

  const typeDescriptions = React.useMemo(
    () =>
      catalogTypes.map(
        (type) =>
          type.description &&
          catalogTypeCounts[type.value] > 0 && (
            <SyncMarkdownView key={type.value} content={type.description} inline />
          ),
      ),
    [catalogTypes, catalogTypeCounts],
  );

  return (
    <>
      <Title headingLevel="h4" style={{ marginLeft: '14px' }}>
        {t('console-shared~Type')}
        <FieldLevelHelp>{typeDescriptions}</FieldLevelHelp>
      </Title>
      <VerticalTabs data-test="catalog-types">
        {catalogTypes.map((type: CatalogType) => {
          const { value, label } = type;
          const typeCount = catalogTypeCounts[value];
          const queryParams = new URLSearchParams(search);
          queryParams.set(CatalogQueryParams.TYPE, type.value);

          const to = {
            pathname,
            search: `?${queryParams.toString()}`,
          };

          if (typeCount === 0 && !type.error) return null;

          return (
            <li key={value} className="vertical-tabs-pf-tab" data-test={`tab ${value}`}>
              {typeCount > 0 && (
                <Link to={to}>
                  {`${label} (${typeCount})`}
                  {type.error && (
                    <>
                      {' '}
                      <Tooltip content={type.error instanceof Error ? type.error.message : null}>
                        <YellowExclamationTriangleIcon />
                      </Tooltip>
                    </>
                  )}
                </Link>
              )}
              {typeCount === 0 && type.error && (
                <span className="ocs-catalog-type-selector__error-type">
                  {`${label} (0)`}{' '}
                  <Tooltip
                    content={t(
                      `console-shared~No {{label}} are available at this time due to loading failures. {{error}}`,
                      { label: type.label, error: type?.error.message ?? '' },
                    )}
                  >
                    <YellowExclamationTriangleIcon />
                  </Tooltip>
                </span>
              )}
            </li>
          );
        })}
      </VerticalTabs>
    </>
  );
};

export default CatalogTypeSelector;
