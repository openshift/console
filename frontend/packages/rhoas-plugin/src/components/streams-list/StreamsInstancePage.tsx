import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import StreamsInstanceFilter from './StreamsInstanceFilter';
import StreamsInstanceTable from './StreamsInstanceTable';
import { PageHeading } from '@console/internal/components/utils';
import { ManagedKafkaEmptyState } from './../empty-state/ManagedKafkaEmptyState';
import { history } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';

// FIXME full typed experience React.FC<{ kafkaArray: ManagedKafkaModel[]}>
const StreamsInstancePage: any = ({ kafkaArray, setSelectedKafka, currentKafkaConnections, currentNamespace, createManagedKafkaConnectionFlow, disableCreate }) => {

  const [allKafkasConnected, setAllKafkasConnected] = React.useState(false);

  const goToTopology = () => {
    history.push(`/topology/ns/${currentNamespace}`);
  }

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
          { kafkaArray.length === 0 ? (
            <ManagedKafkaEmptyState
              title="No Managed Kafka Clusters found"
              actionInfo="Go back to Managed Services Catalog"
              icon="CubesIcon"
            />
          ) : allKafkasConnected ? (
            <ManagedKafkaEmptyState
              title="All Managed Kafka clusters are in use"
              actionInfo="See Managed Kafka clusters in Topology view"
              action={() => goToTopology()}
              icon="CubesIcon"
            />
          ) : (
            <>
              <StreamsInstanceFilter />
              <StreamsInstanceTable
                kafkaArray={kafkaArray}
                setSelectedKafka={setSelectedKafka}
                currentKafkaConnections={currentKafkaConnections}
                allKafkasConnected={allKafkasConnected}
                setAllKafkasConnected={setAllKafkasConnected}
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
          )}
        </PageBody>
    </>
  );
};

export default StreamsInstancePage;
