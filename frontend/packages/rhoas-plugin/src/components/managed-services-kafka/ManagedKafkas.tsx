import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { FormFooter } from '@console/shared';
import { history } from '@console/internal/components/utils';
import './ManagedKafkas.css';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import { ManagedKafkaModel } from './ManagedKafkaModel';
import { ManagedKafkaRequestModel, ManagedServiceAccountRequest, ManagedKafkaConnectionModel } from '../../models/rhoas';
import { useActiveNamespace } from '@console/shared';
import { k8sCreate, k8sGet } from '@console/internal/module/k8s/resource';
import { AccessTokenSecretName } from '../../const'
import { KafkaMocks } from '../mocks/KafkaMocks';
import { ServiceAccountSecretName } from '../../const';
import { Button, EmptyState, EmptyStateIcon, EmptyStateSecondaryActions, Title } from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';

const ManagedKafkas = () => {
  const [currentNamespace] = useActiveNamespace();
  // FIXME IMPORTANT: Name should be fixed later and patched if needed.
  const currentCRName = 'kafkarequest' + currentNamespace + new Date().getTime();
  const currentMSAName = 'managedservice' + currentNamespace + new Date().getTime();

  const kafkaRequestData: ManagedKafkaModel[] = KafkaMocks;
  const [selectedKafkas, setSelectedKafkas] = React.useState([]);
  const [serviceAccountExists, setServiceAccountExists] = React.useState(false);
  const [currentKafkaConnections, setCurrentKafkaConnections] = React.useState([]);

  const doesManagedServiceAccountExist = async () => {
    const managedServiceAccounts = await k8sGet(ManagedServiceAccountRequest, null, currentNamespace);
    if (managedServiceAccounts.items.length > 0) {
      setServiceAccountExists(true);
    }
  }

  const listOfCurrentKafkaConnectionsById = async () => {
    const localArray = [];
    const kafkaConnections = await k8sGet(ManagedKafkaConnectionModel, null, currentNamespace);
    if (kafkaConnections) {
      kafkaConnections.items.map((kafka) => {
        const kafkaId = kafka.spec.kafkaId;
        localArray.push(kafkaId);
      })
      setCurrentKafkaConnections(localArray);
    }
  }

  // const filterCurrentKafkasForAlreadyConnected = currentKafkaConnections => {
  //   console.log('what is kafkaRequestData' + JSON.stringify(kafkaRequestData));
  //   const newKafkaData = kafkaRequestData && kafkaRequestData.filter(kafka => !currentKafkaConnections.includes(kafka.id));
  //   setKafkaRequestData(newKafkaData);
  // }

  // TODO Create actions folder
  const createManagedKafkaRequest = async () => {
    const mkRequest = {
      apiVersion: ManagedKafkaRequestModel.apiGroup + "/" + ManagedKafkaRequestModel.apiVersion,
      kind: ManagedKafkaRequestModel.kind,
      metadata: {
        name: currentCRName,
        namespace: currentNamespace
      },
      spec: {
        accessTokenSecretName: AccessTokenSecretName,
      }
    };

    // FIXME Progress bar/Handling errors here?
    // FIXME Patch existing request if exist etc.
    await k8sCreate(ManagedKafkaRequestModel, mkRequest);
  }

  React.useEffect(() => {
    createManagedKafkaRequest();
    doesManagedServiceAccountExist();
    listOfCurrentKafkaConnectionsById();
  }, []);

  const createManagedServiceAccount = async () => {
    const serviceAcct = {
      apiVersion: "rhoas.redhat.com/v1alpha1",
      kind: ManagedServiceAccountRequest.kind,
      metadata: {
        name: currentMSAName,
        namespace: currentNamespace
      },
      spec: {
        serviceAccountName: "myServiceAccount",
        reset: false,
        description: "some service account",
        serviceAccountSecretName: ServiceAccountSecretName
      },

    }

    await k8sCreate(ManagedServiceAccountRequest, serviceAcct);
  };

  const createManagedKafkaConnection = async (kafkaId, kafkaName) => {
    const kafkaConnection = {
      apiVersion: "rhoas.redhat.com/v1alpha1",
      kind: ManagedKafkaConnectionModel.kind,
      metadata: {
        name: kafkaName,
        namespace: currentNamespace
      },
      spec: {
        kafkaId: kafkaId,
        credentials: {
          serviceAccountSecretName: ServiceAccountSecretName
        }
      }
    }

    await k8sCreate(ManagedKafkaConnectionModel, kafkaConnection);
  };

  const createManagedKafkaConnectionFlow = async () => {
    if (serviceAccountExists !== undefined || serviceAccountExists !== true) {
      createManagedServiceAccount();
    }

    for (const rowId of selectedKafkas) {
      const kafkaId = kafkaRequestData[rowId].id;
      const kafkaName = kafkaRequestData[rowId].name;

      if (currentKafkaConnections) {
        if (!currentKafkaConnections.includes(kafkaId)) {
          createManagedKafkaConnection(kafkaId, kafkaName);
        }
      }
    }
    history.push(`/topology/ns/${currentNamespace}`);
  };

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        {kafkaRequestData.length > 0 ? (
          <>
            <StreamsInstancePage
              kafkaArray={kafkaRequestData}
              selectedKafkas={selectedKafkas}
              setSelectedKafkas={setSelectedKafkas}
              currentKafkaConnections={currentKafkaConnections}
            />
            <div className="co-m-pane__body" style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}>
              <FormFooter
                handleSubmit={() => createManagedKafkaConnectionFlow()}
                isSubmitting={false}
                errorMessage=""
                submitLabel={"Create"}
                disableSubmit={selectedKafkas.length < 1 ? true : false}
                resetLabel="Reset"
                sticky
                handleCancel={history.goBack}
              />
            </div>
          </>
        ) : (
            <EmptyState>
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h4" size="lg">
                No Managed Kafka Clusters found
            </Title>
              <EmptyStateSecondaryActions>
                <Button variant="link">Go back to Managed Services Catalog</Button>
              </EmptyStateSecondaryActions>
            </EmptyState>
          )}
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;
