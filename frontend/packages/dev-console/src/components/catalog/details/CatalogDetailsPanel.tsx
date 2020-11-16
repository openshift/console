import * as React from 'react';
import { CatalogItem } from '@console/plugin-sdk';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import { ExternalLink, SectionHeading, Timestamp } from '@console/internal/components/utils';

type CatalogDetailsPanelProps = {
  item: CatalogItem;
};

const CatalogDetailsPanel: React.FC<CatalogDetailsPanelProps> = ({ item }) => {
  const { description, provider, creationTimestamp, supportUrl, documentationUrl, details } = item;
  return (
    <div className="modal-body modal-body-border">
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              {details?.properties?.map((property) => (
                <PropertyItem key={property.label} label={property.label} value={property.value} />
              ))}
              {provider && <PropertyItem label="Provider" value={provider} />}
              {supportUrl && (
                <PropertyItem
                  label="Support"
                  value={<ExternalLink href={supportUrl} text="Get support" />}
                />
              )}
              {documentationUrl && (
                <PropertyItem
                  label="Documentation"
                  value={<ExternalLink href={documentationUrl} text="Refer documentation" />}
                />
              )}
              {creationTimestamp && (
                <PropertyItem
                  label="Created At"
                  value={<Timestamp timestamp={creationTimestamp} />}
                />
              )}
            </PropertiesSidePanel>
            <div className="co-catalog-page__overlay-description">
              <SectionHeading text="Description" />
              {description && <p>{description}</p>}
              {details?.descriptions?.map((desc) => (
                <React.Fragment key={desc.label}>
                  {desc.label && <SectionHeading text={desc.label} />}
                  {desc.value}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogDetailsPanel;
