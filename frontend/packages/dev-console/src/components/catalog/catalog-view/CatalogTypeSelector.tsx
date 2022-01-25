import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Button, Popover, Title } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { VerticalTabs } from '@patternfly/react-catalog-view-extension';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
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
            <SyncMarkdownView key={type.value} content={type.description} />
          ),
      ),
    [catalogTypes, catalogTypeCounts],
  );

  const info = (
    <Popover headerContent={t('devconsole~Types')} bodyContent={typeDescriptions}>
      <Button variant="link" isInline>
        <OutlinedQuestionCircleIcon className="co-catalog-page__info-icon" />
      </Button>
    </Popover>
  );

  return (
    <>
      <Title headingLevel="h4" style={{ marginLeft: '14px' }}>
        {t('devconsole~Type')} {info}
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
