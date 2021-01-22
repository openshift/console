import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { FormFooter } from '@console/shared';
import { history } from '@console/internal/components/utils';
import './ManagedKafkas.css';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import { ManagedKafkaModel } from './ManagedKafkaModel';
import { ManagedKafkaRequestModel } from '../../models/rhoas';
import { useActiveNamespace } from '@console/shared';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s/resource';
import { AccessTokenSecretName } from '../../const'
import { KafkaMocks } from '../mocks/KafkaMocks';

const ManagedKafkas = () => {
  const [currentNamespace] = useActiveNamespace();
  // FIXME IMPORTANT: Name should be fixed later and patched if needed.
  const currentCRName = 'kafkarequest' + currentNamespace + new Date().getTime();
  const kafkaRequestData: ManagedKafkaModel[] = KafkaMocks;

  // FIXME Pass this down to the table to get checked kafkas
  // const [checkedKafkas, setCheckedKafkas] = useState([])

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

  React.useEffect(() => {
    createManagedKafkaRequest();
  }, []);

  const createManagedKafkaConnection = async () => {
    // FIXME createManagedServiceAccount
    // FIXME createManagedKafkaConnection
  }

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <StreamsInstancePage kafkaArray={kafkaRequestData} />
        <div className="co-m-pane__body" style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}>
          <FormFooter
            handleSubmit={() => createManagedKafkaConnection()}
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
