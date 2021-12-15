import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Title } from '@patternfly/react-core';
import { VerticalTabs } from '@patternfly/react-catalog-view-extension';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { CatalogQueryParams, CatalogType, CatalogTypeCounts } from '../utils/types';

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
        {t('devconsole~Type')}
        <FieldLevelHelp>{typeDescriptions}</FieldLevelHelp>
      </Title>
      <VerticalTabs>
        {catalogTypes.map((type) => {
          const { value, label } = type;
          const typeCount = catalogTypeCounts[value];
          const queryParams = new URLSearchParams(search);
          queryParams.set(CatalogQueryParams.TYPE, type.value);

          const to = {
            path: pathname,
            search: `?${queryParams.toString()}`,
          };

          return typeCount > 0 ? (
            <li key={value} className="vertical-tabs-pf-tab">
              <Link to={to}>{`${label} (${typeCount})`}</Link>
            </li>
          ) : null;
        })}
      </VerticalTabs>
    </>
  );
};

export default CatalogTypeSelector;
