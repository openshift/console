import * as React from 'react';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
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
    <span className="properties-side-panel-pf-property-label">{t('devconsole~N/A')}</span>
  );

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
              <PropertyItem label={t('devconsole~Provider')} value={provider || notAvailable} />
              <PropertyItem
                label={t('devconsole~Support')}
                value={
                  supportUrl ? (
                    <ExternalLink href={supportUrl} text={t('devconsole~Get support')} />
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem
                label={t('devconsole~Documentation')}
                value={
                  documentationUrl ? (
                    <ExternalLink
                      href={documentationUrl}
                      text={t('devconsole~Refer documentation')}
                    />
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem label={t('devconsole~Created at')} value={created || notAvailable} />
            </PropertiesSidePanel>
            {(details?.descriptions?.length || description) && (
              <div className="co-catalog-page__overlay-description">
                <Stack hasGutter>
                  {!details?.descriptions?.[0]?.label && (
                    <SectionHeading text={t('devconsole~Description')} />
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
