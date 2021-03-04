import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import { history } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';
import { PageHeading } from '@console/internal/components/utils';
import StreamsInstanceFilter from './StreamsInstanceFilter';
import StreamsInstanceTable from './StreamsInstanceTable';
import { ManagedKafkaEmptyState } from './../empty-state/ManagedKafkaEmptyState';
import { useActiveNamespace } from '@console/shared';
import { ManagedKafka } from '../../types/rhoas-types';

type StreamsInstancePageProps = {
  kafkaArray: ManagedKafka[];
  selectedKafka: number;
  setSelectedKafka: (selectedKafka: number) => void;
  currentKafkaConnections: Array<string>;
  createManagedKafkaConnectionFlow: () => {};
  disableCreateButton: () => boolean;
};

const StreamsInstancePage = ({
  kafkaArray,
  selectedKafka,
  setSelectedKafka,
  currentKafkaConnections,
  createManagedKafkaConnectionFlow,
  disableCreateButton,
}: StreamsInstancePageProps) => {
  const [currentNamespace] = useActiveNamespace();
  const [allKafkasConnected, setAllKafkasConnected] = React.useState<boolean>(false);
  const [textInputNameValue, setTextInputNameValue] = React.useState<string>('');
  const [pageKafkas, setPageKafkas] = React.useState<ManagedKafka[]>(kafkaArray);
  const { t } = useTranslation();

  React.useEffect(() => {
    setPageKafkas(kafkaArray);
  }, [kafkaArray]);

  const goToTopology = () => {
    history.push(`/topology/ns/${currentNamespace}`);
  };

  const handleTextInputNameChange = (value: string) => {
    let filteredKafkas = kafkaArray.filter((kafka) => kafka.name.includes(value));
    setPageKafkas(filteredKafkas);
    setTextInputNameValue(value);
  };

  return (
    <>
      <Helmet>
        <title>{t('rhoas-plugin~Select Managed Kafka Cluster')}</title>
      </Helmet>
      <PageHeading
        className="rhoas__page-heading"
        title={t('rhoas-plugin~Select Managed Kafka Cluster')}
      >
        <p>
          {t(
            'rhoas-plugin~The managed Kafka cluster selected below will appear on the topology view.',
          )}
        </p>
      </PageHeading>
      <PageBody>
        {allKafkasConnected ? (
          <ManagedKafkaEmptyState
            title={t('rhoas-plugin~All Managed Kafka clusters are in use')}
            actionInfo={t('rhoas-plugin~See Managed Kafka clusters in Topology view')}
            action={() => goToTopology()}
            icon="CubesIcon"
          />
        ) : kafkaArray.length === 0 ? (
          <ManagedKafkaEmptyState
            title={t('rhoas-plugin~No Managed Kafka Clusters found')}
            actionInfo={t('rhoas-plugin~Go back to Managed Services Catalog')}
            icon="CubesIcon"
          />
        ) : (
          <>
            <StreamsInstanceFilter
              textInputNameValue={textInputNameValue}
              handleTextInputNameChange={handleTextInputNameChange}
            />
            <StreamsInstanceTable
              kafkaArray={kafkaArray}
              pageKafkas={pageKafkas}
              handleTextInputNameChange={handleTextInputNameChange}
              selectedKafka={selectedKafka}
              setSelectedKafka={setSelectedKafka}
              currentKafkaConnections={currentKafkaConnections}
              allKafkasConnected={allKafkasConnected}
              setAllKafkasConnected={setAllKafkasConnected}
            />
            <div
              className="co-m-pane__body"
              style={{ borderTop: 0, paddingTop: 0, paddingBottom: 0 }}
            >
              <FormFooter
                handleSubmit={() => createManagedKafkaConnectionFlow()}
                isSubmitting={false}
                errorMessage=""
                submitLabel={t('rhoas-plugin~Create')}
                disableSubmit={disableCreateButton()}
                resetLabel={t('rhoas-plugin~Reset')}
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
