import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import StreamsInstanceFilter from './StreamsInstanceFilter';
import StreamsInstanceTable from './StreamsInstanceTable';
import { PageHeading } from '@console/internal/components/utils';

// FIXME full typed experience React.FC<{ kafkaArray: ManagedKafkaModel[]}>
const StreamsInstancePage: any = ({ kafkaArray, setSelectedKafka, currentKafkaConnections }) => {
  return (
    <>
      <Helmet>
        <title>Select Managed Kafka Cluster</title>
      </Helmet>
      <PageHeading
        className="rhoas__page-heading"
        title="Select Managed Kafka Cluster"
      >
        <p>The managed Kafka cluster selected below will appear in the topology view.</p>
      </PageHeading>
      <PageBody>
        <StreamsInstanceFilter />
        <StreamsInstanceTable
          kafkaArray={kafkaArray}
          setSelectedKafka={setSelectedKafka}
          currentKafkaConnections={currentKafkaConnections}
        />
      </PageBody>
    </>
  );
};

export default StreamsInstancePage;
