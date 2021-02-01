import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { FormFooter } from '@console/shared';
import { history } from '@console/internal/components/utils';
import './ManagedKafkas.css';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import { ManagedKafkaRequestModel } from '../../models/rhoas';
import { useActiveNamespace } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
// import { ManagedKafkaRequestCRName } from '../../const';
import { Button, EmptyState, EmptyStateIcon, EmptyStateSecondaryActions, Title } from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
import {
  createManagedKafkaConnection,
  createManagedKafkaRequestIfNeeded,
  createServiceAccountIfNeeded,
  listOfCurrentKafkaConnectionsById
} from './resourceCreators';

import { KafkaRequest } from "./types"

const ManagedKafkas = () => {
  const [currentNamespace] = useActiveNamespace();
  const [selectedKafka, setSelectedKafka] = React.useState<number>();
  const [serviceAccountCreated, setServiceAccountCreated] = React.useState(false);
  const [currentKafkaConnections, setCurrentKafkaConnections] = React.useState([]);
  const [kafkaRequest, setKafkaRequest] = React.useState();

  const [watchedKafkaRequest, loaded, error] = useK8sWatchResource<KafkaRequest[]>({
    kind: ManagedKafkaRequestModel.kind,
    namespace: currentNamespace,
    isList: false
  })

  console.log("what is ManagedKafkas", watchedKafkaRequest, loaded, error);
  console.log('what is kafkaRequest' + JSON.stringify(kafkaRequest));

  const createKafkaRequestFlow = async () => {
    const request = await createManagedKafkaRequestIfNeeded(currentNamespace);
    const managedServiceAccount = await createServiceAccountIfNeeded(currentNamespace);
    const currentKafka = await listOfCurrentKafkaConnectionsById(currentNamespace)
    if (currentKafka) {
      setCurrentKafkaConnections(currentKafka);
    }
    if (!managedServiceAccount) {
      setServiceAccountCreated(true);
    }
    setKafkaRequest(request);
  }

  React.useEffect(() => {
    createKafkaRequestFlow()
  }, []);

  console.log("watchedKafkaRequest", watchedKafkaRequest)
  if (watchedKafkaRequest.length === 0 || !watchedKafkaRequest[0] || !watchedKafkaRequest[0].status) {
    return (<><h1>Loading</h1></>)
  }
  const singleKafkaRequest = watchedKafkaRequest[0];
  const kafkaRequestData = singleKafkaRequest.status.userKafkas;
  console.log('what is kafkaRequestData', kafkaRequestData);

  if (kafkaRequestData.length === 0) {
    return <NamespacedPage disabled variant={NamespacedPageVariants.light} hideApplications>
      <EmptyState>
        <EmptyStateIcon icon={CubesIcon} />
        <Title headingLevel="h4" size="lg">
          No Managed Kafka Clusters found
        </Title>
        <EmptyStateSecondaryActions>
          <Button variant="link">Go back to Managed Services Catalog</Button>
        </EmptyStateSecondaryActions>
      </EmptyState>
    </NamespacedPage>
  }

  const createManagedKafkaConnectionFlow = async () => {
    // TODO verify if service account sercret exist
    const kafkaId = kafkaRequestData[selectedKafka].id;
    const kafkaName = kafkaRequestData[selectedKafka].name;
    if (currentKafkaConnections) {
      if (!currentKafkaConnections.includes(kafkaId)) {
        createManagedKafkaConnection(kafkaId, kafkaName, currentNamespace);
      }
    }
    history.push(`/topology/ns/${currentNamespace}`);
  };

  const disableCreate = () => {
    if (selectedKafka === null || selectedKafka === undefined) {
      return true;
    }
    if (currentKafkaConnections.length === kafkaRequestData.length) {
      return true;
    }
    else {
      return false;
    }
  }

  return (
    <>
      <NamespacedPage disabled variant={NamespacedPageVariants.light} hideApplications>
        <>
          {serviceAccountCreated ? (<><p>Created Service Account</p></>) : ""}
          <StreamsInstancePage
            kafkaArray={kafkaRequestData}
            setSelectedKafka={setSelectedKafka}
            currentKafkaConnections={currentKafkaConnections}
          />
          <div className="co-m-pane__body" style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}>
            <FormFooter
              handleSubmit={() => createManagedKafkaConnectionFlow()}
              isSubmitting={false}
              errorMessage=""
              submitLabel={"Create"}
              disableSubmit={disableCreate()}
              resetLabel="Reset"
              sticky
              handleCancel={history.goBack}
            />
          </div>
        </>
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;
