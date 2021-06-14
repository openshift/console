import * as React from 'react';
import { Button } from '@patternfly/react-core';
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon';
import { useTranslation, Trans } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { history } from '@console/internal/components/utils';
import { FormFooter, FormBody } from '@console/shared';
import { CloudKafka } from '../../utils/rhoas-types';
import ServiceInstanceFilter from '../service-table/ServiceInstanceFilter';
import ServiceInstanceTable from '../service-table/ServiceInstanceTable';
import { ServicesEmptyState } from '../states';

type ConnectionErrorProps = {
  title: string;
  message: string;
  action: () => void;
  actionLabel: string;
};

type ServiceInstanceProps = {
  kafkaArray: CloudKafka[];
  selectedKafka: number;
  setSelectedKafka: (selectedKafka: number) => void;
  currentKafkaConnections: string[];
  createKafkaConnectionFlow: () => void;
  isSubmitting: boolean;
  currentNamespace: string;
  connectionError: ConnectionErrorProps;
};

const areAllServicesSelected = (currentServices: string[], listOfServices: CloudKafka[]) =>
  listOfServices.every(
    (service) => currentServices.includes(service.id) || service.status !== 'ready',
  );

const ServiceInstance: React.FC<ServiceInstanceProps> = ({
  kafkaArray,
  selectedKafka,
  setSelectedKafka,
  currentKafkaConnections,
  createKafkaConnectionFlow,
  isSubmitting,
  currentNamespace,
  connectionError,
}: ServiceInstanceProps) => {
  const [textInputNameValue, setTextInputNameValue] = React.useState<string>('');
  const pageKafkas = React.useMemo(
    () => kafkaArray.filter((kafka) => kafka.name.includes(textInputNameValue)),
    [kafkaArray, textInputNameValue],
  );

  const { t } = useTranslation();

  const noKafkaInstancesExist = (
    <Trans t={t} ns="rhoas-plugin">
      To make sure the instance exists and that you&lsquo;re authorized to access it, you can see
      your Kafka instances at{' '}
      <a href="https://cloud.redhat.com/openshift/token" rel="noopener noreferrer" target="_blank">
        https://cloud.redhat.com.
      </a>{' '}
      To discover more managed services, go to the{' '}
      <Button
        isInline
        variant="link"
        onClick={() => history.push(`/catalog/ns/${currentNamespace}?catalogType=managedservices`)}
      >
        managed services catalog.
      </Button>
    </Trans>
  );

  return (
    <>
      <FormBody flexLayout style={{ borderTop: 0 }}>
        <FormSection fullWidth>
          {connectionError ? (
            <ServicesEmptyState
              title={connectionError.title}
              message={connectionError.message}
              actionLabel={connectionError.actionLabel}
              action={connectionError.action}
              icon={TimesCircleIcon}
            />
          ) : kafkaArray.length === 0 ? (
            <ServicesEmptyState
              title={t('rhoas-plugin~Could not connect to Kafka instances')}
              message={noKafkaInstancesExist}
              icon={TimesCircleIcon}
            />
          ) : areAllServicesSelected(currentKafkaConnections, kafkaArray) ? (
            <ServicesEmptyState
              title={t('rhoas-plugin~All available Kafka instances are connected to this project')}
              actionLabel={t('rhoas-plugin~See Kafka instances in topology view')}
              action={() => history.push(`/topology/ns/${currentNamespace}`)}
              icon={TimesCircleIcon}
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
        isSubmitting={isSubmitting}
        errorMessage=""
        submitLabel={t('rhoas-plugin~Next')}
        disableSubmit={selectedKafka === undefined || connectionError !== undefined || isSubmitting}
        resetLabel={t('rhoas-plugin~Cancel')}
        sticky
        handleCancel={history.goBack}
      />
    </>
  );
};

export default ServiceInstance;
