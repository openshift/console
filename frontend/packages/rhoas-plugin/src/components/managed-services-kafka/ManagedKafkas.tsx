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
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s/resource';
import { AccessTokenSecretName } from '../../const'
import { KafkaMocks } from '../mocks/KafkaMocks';
import { ServiceAccountSecretName } from '../../const';

const ManagedKafkas = () => {
  const [currentNamespace] = useActiveNamespace();
  // FIXME IMPORTANT: Name should be fixed later and patched if needed.
  const currentCRName = 'kafkarequest' + currentNamespace + new Date().getTime();
  const currentMSAName = 'managedService' + currentNamespace + new Date().getTime();

  const kafkaRequestData: ManagedKafkaModel[] = KafkaMocks;

  // Array of selected kafkas
  const [selectedKafkas, setSelectedKafkas] = React.useState([]);
  console.log('what is the selected kafka array' + selectedKafkas);

  React.useEffect(() => {
    createManagedKafkaRequest();
  }, []);

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
      },
      status: {
        lastUpdate: new Date().getTime(),
        userKafkas: KafkaMocks
      }
    };

    // FIXME Progress bar/Handling errors here?
    // FIXME Patch existing request if exist etc.
    await k8sCreate(ManagedKafkaRequestModel, mkRequest)
    await k8sPatch(ManagedKafkaRequestModel, mkRequest)
    await new Promise((resolver) => {
      setTimeout(resolver, 3000);
    })
  }

  const createManagedServiceAccount = async () => {
    const serviceAcct = {
      apiVersion: "rhoas.redhat.com/v1alpha1",
      kind: ManagedServiceAccountRequest.kind,
      metadata: {
        name: currentMSAName
      },
      spec: {
        serviceAccountName: "myServiceAccount",
        reset: false,
        description: "some service account",
        serviceAccountSecretname: ServiceAccountSecretName
      }
      // status: {
      //   message: "created",
      //   updated: new Date().getTime(),
      //   serviceAccountSecretName: "service-account-123-credentials"
      // }
    }

    await k8sCreate(ManagedServiceAccountRequest, serviceAcct);
  };

  const createManagedKafkaConnection = async (kafkaId) => {
    const kafkaConnection = {
      apiVersion: "rhoas.redhat.com/v1alpha1",
      kind: ManagedKafkaConnectionModel.kind,
      metadata: {
        name: "test453-serviceapi"
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
    await k8sCreate(ManagedKafkaConnectionModel, kafkaConnection);
  };

  const createManagedKafkaConnectionFlow = async () => {
    createManagedServiceAccount();

    selectedKafkas.forEach(function(rowId) {
      createManagedKafkaConnection(kafkaRequestData[rowId].id);
    }
  };
  
  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
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
            disableSubmit={false}
            resetLabel="Reset"
            sticky
            handleCancel={history.goBack}
          />
        </div>
      </NamespacedPage>
    </>
  );
};

export default ManagedKafkas;
