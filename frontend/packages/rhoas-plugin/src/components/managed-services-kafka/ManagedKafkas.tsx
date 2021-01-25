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

  React.useEffect(() => {
    createManagedKafkaRequest();
    doesManagedServiceAccountExist();
    listOfCurrentKafkaConnectionsById();
  }, []);

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

  // TODO Create actions folder
  const createManagedKafkaRequest = async () => {
    const mkRequest = {
      apiVersion: "rhoas.redhat.com/v1alpha1",// ManagedKafkaRequestModel.apiVersion,
      kind: ManagedKafkaRequestModel.kind,
      metadata: {
        name: currentCRName,
        namespace: currentNamespace
      },
      spec: {
        accessTokenSecretName: AccessTokenSecretName,
        status: {
          lastUpdate: new Date().getTime(),
          userKafkas: kafkaRequestData
        }
      }
    };

    // FIXME Progress bar/Handling errors here?
    // FIXME Patch existing request if exist etc.
    try {
      const resource = await k8sCreate(ManagedKafkaRequestModel, mkRequest);
      console.log('what is resource' + JSON.stringify(resource));
    } catch (error) {
      console.log('what is error' + error)
    }
    // await k8sPatch(ManagedKafkaRequestModel, mkRequest)
    // await new Promise((resolver) => {
    //   setTimeout(resolver, 3000);
    // })
  }

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
        serviceAccountSecretname: ServiceAccountSecretName,
        status: {
          message: "created",
          updated: new Date().getTime(),
          serviceAccountSecretName: "service-account-123-credentials"
        }
      }
    }

    try {
      const resource = await k8sCreate(ManagedServiceAccountRequest, serviceAcct);
      console.log('what is service account' + JSON.stringify(resource));
    } catch (error) {
      console.log('what is error' + error)
    }

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
      },
      // status: {
      //   message: "created",
      //   updated: new Date().getTime(),
      //   boostrapServer: {
      //     host: "kafka--ltosqyk-wsmt-t-elukpkft-bg.apps.ms-bv8dm6nbd3jo.cx74.s1.devshift.org:443"
      //   },
      //   serviceAccountSecretName: "service-account-123-credentials"
      // }
    }

    try {
      const resource = await k8sCreate(ManagedKafkaConnectionModel, kafkaConnection);
      console.log('what is response for create connection' + JSON.stringify(resource));
    } catch (error) {
      console.log('what is error' + error)
    }
  };

  const createManagedKafkaConnectionFlow = async () => {
    if (serviceAccountExists !== undefined || serviceAccountExists !== true) {
      createManagedServiceAccount();
    }

    selectedKafkas.forEach(function(rowId) {
      const kafkaId = kafkaRequestData[rowId].id;
      const kafkaName = kafkaRequestData[rowId].name;

      if(currentKafkaConnections) {
        console.log('is currentKafkaConnections true' + currentKafkaConnections);
        if(!currentKafkaConnections.includes(kafkaId)) {
          createManagedKafkaConnection(kafkaId, kafkaName);
        }
      }
    });
  };

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        { kafkaRequestData.length > 0 ? (
          <>
            <StreamsInstancePage
              kafkaArray={kafkaRequestData}
              selectedKafkas={selectedKafkas}
              setSelectedKafkas={setSelectedKafkas}
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
