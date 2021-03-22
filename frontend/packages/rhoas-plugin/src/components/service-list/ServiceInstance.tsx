/* eslint-disable prettier/prettier */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormFooter, FormHeader, FlexForm, FormBody } from '@console/shared';
import { history } from '@console/internal/components/utils';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import ServiceInstanceFilter from '../service-table/ServiceInstanceFilter';
import ServiceInstanceTable from '../service-table/ServiceInstanceTable';
import { ServicesEmptyState } from '../states/ServicesEmptyState';
import { CloudKafka } from '../../utils/rhoas-types';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';

type ServiceInstanceProps = {
  kafkaArray: CloudKafka[];
  selectedKafka: number;
  setSelectedKafka: (selectedKafka: number) => void;
  currentKafkaConnections: string[];
  createKafkaConnectionFlow: () => void;
  disableCreateButton: boolean;
};

function areAllServicesSelected(currentServices: string[], listOfServices: CloudKafka[]) {
  const selectedServices = listOfServices.reduce((count, service) => {
    if (service.status !== 'ready') {
      return count;
    }
    for (const selectedService of currentServices) {
      if (selectedService === service.id) {
        return count;
      }
    }
    return count + 1;
  }, 0);
  return selectedServices === 0;
}

const ServiceInstance: React.FC<ServiceInstanceProps> = ({
  kafkaArray,
  selectedKafka,
  setSelectedKafka,
  currentKafkaConnections,
  createKafkaConnectionFlow,
  disableCreateButton,
}: ServiceInstanceProps) => {
  const [textInputNameValue, setTextInputNameValue] = React.useState<string>('');
  // const [pageKafkas, setPageKafkas] = React.useState<CloudKafka[]>(kafkaArray);

  const pageKafkas = React.useMemo(
    () => kafkaArray.filter((kafka) => kafka.name.includes(textInputNameValue)),
    [kafkaArray, textInputNameValue],
  );

  const { t } = useTranslation();

  const handleTextInputNameChange = (value: string) => {
    setTextInputNameValue(value);
  };

  return (
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
          {areAllServicesSelected(currentKafkaConnections, kafkaArray) ? (
            <ServicesEmptyState
              title={t('rhoas-plugin~All Kafka clusters are in use')}
              actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
              icon={CubesIcon}
            />
          ) : kafkaArray.length === 0 ? (
            <ServicesEmptyState
              title={t('rhoas-plugin~No Kafka Clusters found')}
              actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
              icon={CubesIcon}
            />
          ) : (
            <>
              <ServiceInstanceFilter
                textInputNameValue={textInputNameValue}
                handleTextInputNameChange={handleTextInputNameChange}
              />
              <ServiceInstanceTable
                kafkaArray={kafkaArray}
                pageKafkas={pageKafkas}
                setTextInputNameValue={setTextInputNameValue}
                selectedKafka={selectedKafka}
                setSelectedKafka={setSelectedKafka}
                currentKafkaConnections={currentKafkaConnections}
              />
            </>
          )}
        </FormSection>
      </FormBody>
      <FormFooter
        handleSubmit={createKafkaConnectionFlow}
        isSubmitting={disableCreateButton}
        errorMessage=""
        submitLabel={t('rhoas-plugin~Create')}
        disableSubmit={disableCreateButton}
        resetLabel={t('rhoas-plugin~Cancel')}
        sticky
        handleCancel={history.goBack}
      />
    </FlexForm>
  );
};

export default ServiceInstance;
