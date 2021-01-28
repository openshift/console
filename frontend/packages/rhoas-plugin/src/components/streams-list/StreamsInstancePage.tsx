import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import StreamsInstanceFilter from './StreamsInstanceFilter';
import StreamsInstanceTable from './StreamsInstanceTable';
import { PageHeading } from '@console/internal/components/utils';

// FIXME full typed experience React.FC<{ kafkaArray: ManagedKafkaModel[]}>
const StreamsInstancePage: any = ({ kafkaArray, selectedKafkas, setSelectedKafkas, currentKafkaConnections }) => {
  return (
    <>
      <Helmet>
        <title>Select Bindable OpenShift Streams for Apache Kafka</title>
      </Helmet>
      <PageHeading
        className="rhoas__page-heading"
        title="Select Bindable OpenShift Streams for Apache Kafka"
      >
        <p>Select all of the OpenShift Streams instances youd like to connect to.</p>
      </PageHeading>
      <PageBody>
        <StreamsInstanceFilter />
        <StreamsInstanceTable
          kafkaArray={kafkaArray}
          selectedKafkas={selectedKafkas}
          setSelectedKafkas={setSelectedKafkas}
          currentKafkaConnections={currentKafkaConnections}
        />
      </PageBody>
    </>
  );
};

export default StreamsInstancePage;
