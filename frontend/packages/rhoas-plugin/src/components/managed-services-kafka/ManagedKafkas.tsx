import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { FormFooter } from '@console/shared';
import { history } from '@console/internal/components/utils';
import './ManagedKafkas.css';
import StreamsInstancePage from '../streams-list/StreamsInstancePage';
import { ManagedKafkaModel } from './ManagedKafkaModel';

const ManagedKafkas = () => {

  const handleNext = () => {

  }
  const kafkaRequestData : ManagedKafkaModel[]= [
    {
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
    }
  ];

  return (
    <>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <StreamsInstancePage kafkaArray={kafkaRequestData}/>
        <div className="co-m-pane__body" style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}>
          <FormFooter
            handleSubmit={() => handleNext()}
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
