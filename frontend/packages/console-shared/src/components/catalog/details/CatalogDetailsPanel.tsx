import * as React from 'react';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { ExternalLink, SectionHeading, Timestamp } from '@console/internal/components/utils';

type CatalogDetailsPanelProps = {
  item: CatalogItem;
};

const CatalogDetailsPanel: React.FC<CatalogDetailsPanelProps> = ({ item }) => {
  const { t } = useTranslation();
  const { description, provider, creationTimestamp, supportUrl, documentationUrl, details } = item;
  const created = Date.parse(creationTimestamp) ? (
    <Timestamp timestamp={creationTimestamp} />
  ) : (
    creationTimestamp
  );
  const notAvailable = (
    <span className="properties-side-panel-pf-property-label">{t('console-shared~N/A')}</span>
  );
  const providerLabel = t('console-shared~Provider');
  const customProvider = details?.properties?.some((property) => property.label === providerLabel);

  return (
    <div className="modal-body modal-body-border">
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              {details?.properties?.map((property) => (
                <PropertyItem
                  key={property.label}
                  label={property.label}
                  value={property.value || notAvailable}
                />
              ))}
              {!customProvider && (
                <PropertyItem label={providerLabel} value={provider || notAvailable} />
              )}
              <PropertyItem
                label={t('console-shared~Created at')}
                value={created || notAvailable}
              />
              <PropertyItem
                label={t('console-shared~Support')}
                value={
                  supportUrl ? (
                    <ExternalLink href={supportUrl} text={t('console-shared~Get support')} />
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem
                label={t('console-shared~Documentation')}
                value={
                  documentationUrl ? (
                    <ExternalLink
                      href={documentationUrl}
                      text={t('console-shared~Refer documentation')}
                    />
                  ) : (
                    notAvailable
                  )
                }
              />
            </PropertiesSidePanel>
            {(details?.descriptions?.length || description) && (
              <div className="co-catalog-page__overlay-description">
                <Stack hasGutter>
                  {!details?.descriptions?.[0]?.label && (
                    <SectionHeading text={t('console-shared~Description')} />
                  )}
                  {!details?.descriptions?.length && description && <p>{description}</p>}
                  {details?.descriptions?.map((desc, index) => (
                    <StackItem key={index}>
                      {desc.label && <SectionHeading text={desc.label} />}
                      {desc.value}
                    </StackItem>
                  ))}
                </Stack>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogDetailsPanel;
