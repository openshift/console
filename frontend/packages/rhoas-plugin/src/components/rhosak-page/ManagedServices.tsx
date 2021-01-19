import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { history } from '@console/internal/components/utils';
import { PageLayout } from '@console/shared';
import ManagedServicesToken from './ManagedServicesToken';


const navigateTo = (e: React.SyntheticEvent, url: string) => {
  history.push(url);
  e.preventDefault();
};

const ODCEmptyState = () => {
  const defaultHintBlockText = `Select Managed Service you would like to connect with.

  To use the Red Hat Managed Services you need to have account and at least one active service in https://cloud.redhat.com`;

  return (
    <>
      <PageLayout title={"Select Managed Service"} hint={defaultHintBlockText} isDark>
        <Gallery className="co-catalog-tile-view" hasGutter>
          <GalleryItem>
            <CatalogTile
              data-test-id={"id"}
              className="co-catalog-tile"
              onClick={(e: React.SyntheticEvent) => navigateTo(e, "/managedServices/managedkafka")}
              href={"/managedServices/managedkafka"}
              title={"ManagedKafka"}
              iconImg={""}
              iconClass={""}
              icon={""}
              description={"Connect to OpenShift Streams for Apache Kafka"}
            />
          </GalleryItem>
        </Gallery>
        <div style={{ "position": "absolute", "bottom": 10 }}>
          <ManagedServicesToken></ManagedServicesToken>
        </div>
      </PageLayout>
    </>
  );
};

export default ODCEmptyState;
