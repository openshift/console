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

const areAllServicesSelected = (currentServices: string[], listOfServices: CloudKafka[]) =>
  listOfServices.some(
    (service) => service.status !== 'ready' || !currentServices.includes(service.id),
  );

const ServiceInstance: React.FC<ServiceInstanceProps> = ({
  kafkaArray,
  selectedKafka,
  setSelectedKafka,
  currentKafkaConnections,
  createKafkaConnectionFlow,
  disableCreateButton,
}: ServiceInstanceProps) => {
  const [textInputNameValue, setTextInputNameValue] = React.useState<string>('');

  const pageKafkas = React.useMemo(
    () => kafkaArray.filter((kafka) => kafka.name.includes(textInputNameValue)),
    [kafkaArray, textInputNameValue],
  );

  const { t } = useTranslation();

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
          {!areAllServicesSelected(currentKafkaConnections, kafkaArray) ? (
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
                setTextInputNameValue={setTextInputNameValue}
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
