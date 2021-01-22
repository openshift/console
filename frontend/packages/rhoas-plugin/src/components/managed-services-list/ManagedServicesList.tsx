import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { history } from '@console/internal/components/utils';
import { PageLayout } from '@console/shared';
import AccessManagedServices from '../access-managed-services/AccessManagedServices';
import { useActiveNamespace } from 'packages/console-shared/src/hooks/redux-selectors';
import { ManagedKafkaRequestModel } from '../../models/rhoas';
import { k8sCreate } from 'public/module/k8s';

const navigateTo = (e: React.SyntheticEvent, url: string) => {
  history.push(url);
  e.preventDefault();
};

const ManagedServicesList = () => {
  const [currentNamespace] = useActiveNamespace();

  // FIXME use the same secretname across 2 components
  const accessTokenSecretName = "rh-managed-services-api-accesstoken"
  // FIXME IMPORTANT: Name should be fixed later and patched if needed.
  const currentCRName = 'KafkaRequest-' + currentNamespace + new Date().getTime();

  // FIXME status is used only to simulate operator work and it should be removed
  const status = [{
    id: '1iSY6RQ3JKI8Q0OTmjQFd3ocFRg',
    kind: 'kafka',
    href: '/api/managed-services-api/v1/kafkas/1iSY6RQ3JKI8Q0OTmjQFd3ocFRg',
    status: 'ready',
    cloudProvider: 'aws',
    multiAz: true,
    region: 'us-east-1',
    owner: 'api_kafka_service',
    name: 'serviceapi',
    bootstrapServerHost:
      'serviceapi-1isy6rq3jki8q0otmjqfd3ocfrg.apps.ms-bttg0jn170hp.x5u8.s1.devshift.org',
    createdAt: '2020-10-05T12:51:24.053142Z',
    updatedAt: '2020-10-05T12:56:36.362208Z',
  },
  {
    id: '1iSY6RQ3JKI8Q0OTmjQFd3ocFRz',
    kind: 'kafka',
    href: '/api/managed-services-api/v1/kafkas/1iSY6RQ3JKI8Q0OTmjQFd3ocFRz',
    status: 'ready',
    cloudProvider: 'aws',
    multiAz: true,
    region: 'us-east-1',
    owner: 'api_kafka_service',
    name: 'kafka',
    bootstrapServerHost:
      'serviceapi-1isy6rq3jki8q0otmjqfd3ocfrx.apps.ms-bttg0jn170hp.x5u8.s1.devshift.org',
    createdAt: '2021-01-19T12:51:24.053142Z',
    updatedAt: '2021-01-19T12:56:36.362208Z',
  },
  ];

  // FIXME ? Should be part of the ManagedKafkas?
  const onKafkaServiceNagivate = async (e: React.SyntheticEvent) => {
    const mkRequest = {
      apiVersion: ManagedKafkaRequestModel.apiVersion,
      kind: ManagedKafkaRequestModel.kind,
      metadata: {
        name: currentCRName,
        currentNamespace
      },
      spec: {
        accessTokenSecretName: accessTokenSecretName,
      },
      status: status
    };

    // Progress bar/Handling errors here?
    await k8sCreate(ManagedKafkaRequestModel, mkRequest)

    navigateTo(e, "/managedServices/managedkafka")
  }

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
              onClick={(e: React.SyntheticEvent) => onKafkaServiceNagivate(e)}
              href={"/managedServices/managedkafka"}
              title={"ManagedKafka"}
              iconImg={""}
              iconClass={""}
              icon={""}
              description={"Connect to OpenShift Streams for Apache Kafka"}
            />
          </GalleryItem>
        </Gallery>
        <div style={{ "position": "absolute", "bottom": 10, "width": "100%" }}>
          <AccessManagedServices />
        </div>
      </PageLayout>

    </>
  );
};

export default ManagedServicesList;
