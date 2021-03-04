import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { history } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { LoadingBox } from '@console/internal/components/utils';
import { useActiveNamespace } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import { ManagedServicesRequestModel } from '../../models/rhoas';
import { ManagedServicesRequestCRName } from '../../const';
import {
  createManagedKafkaConnection,
  createManagedServicesRequestIfNeeded,
  listOfCurrentKafkaConnectionsById,
} from './resourceCreators';
import { KafkaRequest } from '../../types/rhoas-types';

const ManagedKafkas = () => {
  const [currentNamespace] = useActiveNamespace();
  const [selectedKafka, setSelectedKafka] = React.useState<number>();
  const [currentKafkaConnections, setCurrentKafkaConnections] = React.useState<Array<string>>([]);

  const createKafkaRequestFlow = async () => {
    await createManagedServicesRequestIfNeeded(currentNamespace);

    const currentKafka = await listOfCurrentKafkaConnectionsById(currentNamespace);
    if (currentKafka) {
      setCurrentKafkaConnections(currentKafka);
    }
  };

  React.useEffect(() => {
    createKafkaRequestFlow();
  }, []);

  const [watchedKafkaRequest] = useK8sWatchResource<KafkaRequest>({
    kind: referenceForModel(ManagedServicesRequestModel),
    name: ManagedServicesRequestCRName,
    namespace: currentNamespace,
    isList: false,
    optional: true,
  });

  // TO DO: Replace this once we get error handling from operator
  if (!watchedKafkaRequest || !watchedKafkaRequest.status) {
    return (
      <div>
        <LoadingBox />
      </div>
    );
  }

  let remoteKafkaInstances = watchedKafkaRequest.status.userKafkas;

  const createManagedKafkaConnectionFlow = async () => {
    const kafkaId = remoteKafkaInstances[selectedKafka].id;
    const kafkaName = remoteKafkaInstances[selectedKafka].name;
    if (currentKafkaConnections) {
      if (!currentKafkaConnections.includes(kafkaId)) {
        createManagedKafkaConnection(kafkaId, kafkaName, currentNamespace);
      }
    }
    history.push(`/topology/ns/${currentNamespace}`);
  };

  const disableCreateButton = () => {
    if (selectedKafka === null || selectedKafka === undefined) {
      return true;
    }
    if (currentKafkaConnections.length === remoteKafkaInstances.length) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
        <StreamsInstancePage
          kafkaArray={remoteKafkaInstances}
          selectedKafka={selectedKafka}
          setSelectedKafka={setSelectedKafka}
          currentKafkaConnections={currentKafkaConnections}
          createManagedKafkaConnectionFlow={createManagedKafkaConnectionFlow}
          disableCreateButton={disableCreateButton}
        />
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;
