/* eslint-disable prettier/prettier */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormFooter, FormHeader, FlexForm, FormBody } from '@console/shared';
import { history } from '@console/internal/components/utils';
import StreamsInstanceFilter from '../service-table/StreamsInstanceFilter';
import StreamsInstanceTable from '../service-table/StreamsInstanceTable';
import { ServicesEmptyState } from '../states/ServicesEmptyState';
import { CloudKafka } from '../../utils/rhoas-types';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

type ServiceInstanceProps = {
  kafkaArray: CloudKafka[];
  selectedKafka: number;
  setSelectedKafka: (selectedKafka: number) => void;
  currentKafkaConnections: string[];
  createKafkaConnectionFlow: () => {};
  disableCreateButton: () => boolean;
};

const ServiceInstance = ({
  kafkaArray,
  selectedKafka,
  setSelectedKafka,
  currentKafkaConnections,
  createKafkaConnectionFlow,
  disableCreateButton,
}: ServiceInstanceProps) => {
  const [allKafkasConnected, setAllKafkasConnected] = React.useState<boolean>(false);
  const [textInputNameValue, setTextInputNameValue] = React.useState<string>('');
  const [pageKafkas, setPageKafkas] = React.useState<CloudKafka[]>(kafkaArray);
  const { t } = useTranslation();

  React.useEffect(() => {
    setPageKafkas(kafkaArray);
  }, [kafkaArray]);

  const handleTextInputNameChange = (value: string) => {
    const filteredKafkas = kafkaArray.filter((kafka) => kafka.name.includes(value));
    setPageKafkas(filteredKafkas);
    setTextInputNameValue(value);
  };

  return (
    <>
      <FlexForm>
        <FormBody flexLayout>
          <FormHeader
            title={t('rhoas-plugin~Select Kafka Cluster')}
            helpText={t(
              'rhoas-plugin~The Kafka cluster selected below will appear on the topology view.',
            )}
            marginBottom="lg"
          />
          <FormSection fullWidth flexLayout extraMargin>
            {allKafkasConnected ? (
              <ServicesEmptyState
                title={t('rhoas-plugin~All Kafka clusters are in use')}
                actionInfo={t('rhoas-plugin~Go back to Services Catalog')}
                icon="CubesIcon"
              />
            ) : kafkaArray.length === 0 ? (
              <ServicesEmptyState
                title={t('rhoas-plugin~No Kafka Clusters found')}
                actionInfo={t('rhoas-plugin~Go back to Services Catalog')}
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
              </>
            )}
          </FormSection>
        </FormBody>
        <FormFooter
          handleSubmit={() => createKafkaConnectionFlow()}
          isSubmitting={false}
          errorMessage=""
          submitLabel={t('rhoas-plugin~Create')}
          disableSubmit={disableCreateButton()}
          resetLabel={t('rhoas-plugin~Reset')}
          sticky
          handleCancel={history.goBack}
        />
      </FlexForm>
    </>
  );
};

export default ServiceInstance;
