import * as React from 'react';
import ServiceInstance from './ServiceInstance';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { history, LoadingBox } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useTranslation } from 'react-i18next';
import { CloudServicesRequestModel } from '../../models/rhoas';
import { ServicesRequestCRName } from '../../const';
import {
  createKafkaConnection,
  createCloudServicesRequestIfNeeded,
  deleteKafkaConnection,
  listOfCurrentKafkaConnectionsById,
} from '../../utils/resourceCreators';
import { KafkaRequest } from '../../utils/rhoas-types';
import {
  isResourceStatusSuccessfull,
  isAcccesTokenSecretValid,
  getFinishedCondition,
} from '../../utils/conditionHandler';
import { ServicesErrorState } from '../states/ServicesErrorState';

const ServiceListPage: React.FC = () => {
  const [currentNamespace] = useActiveNamespace();
  const [selectedKafka, setSelectedKafka] = React.useState<number>();
  const [currentKafkaConnections, setCurrentKafkaConnections] = React.useState<string[]>();
  const { t } = useTranslation();
  const [kafkaCreateError, setKafkaCreateError] = React.useState<string>();
  const [kafkaListError, setKafkaListError] = React.useState<string>();
  const [isSubmitting, setSubmitting] = React.useState<boolean>(false);

  React.useEffect(() => {
    const createKafkaRequestFlow = async () => {
      try {
        await createCloudServicesRequestIfNeeded(currentNamespace);

        const currentKafka = await listOfCurrentKafkaConnectionsById(currentNamespace);
        if (currentKafka) {
          setCurrentKafkaConnections(currentKafka);
        }
      } catch (error) {
        setKafkaListError(error);
      }
    };
    createKafkaRequestFlow();
  }, [currentNamespace]);

  const [watchedKafkaRequest] = useK8sWatchResource<KafkaRequest>({
    kind: referenceForModel(CloudServicesRequestModel),
    name: ServicesRequestCRName,
    namespace: currentNamespace,
    isList: false,
    optional: true,
  });

  const remoteKafkaInstances = watchedKafkaRequest?.status?.userKafkas || [];

  const createKafkaConnectionFlow = React.useCallback(async () => {
    setSubmitting(true);
    const { id, name } = remoteKafkaInstances[selectedKafka];
    try {
      await createKafkaConnection(id, name, currentNamespace);
      history.push(`/topology/ns/${currentNamespace}`);
      setSubmitting(false);
    } catch (error) {
      deleteKafkaConnection(name, currentNamespace);
      setKafkaCreateError(error);
      setSubmitting(false);
    }
  }, [currentNamespace, remoteKafkaInstances, selectedKafka]);

  if (kafkaCreateError) {
    return (
      <ServicesErrorState
        title={t('rhoas-plugin~Failed to create connection')}
        message={kafkaCreateError + t('rhoas-plugin~Please try again')}
        actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
      />
    );
  }

  if (kafkaListError) {
    return (
      <ServicesErrorState
        title={t('rhoas-plugin~Could not fetch services')}
        message={t('rhoas-plugin~Failed to load list of services', {
          error: kafkaListError,
        })}
        actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
      />
    );
  }

  if (
    !watchedKafkaRequest ||
    !watchedKafkaRequest.status ||
    currentKafkaConnections === undefined
  ) {
    return <LoadingBox />;
  }

  if (!isResourceStatusSuccessfull(watchedKafkaRequest)) {
    if (!isAcccesTokenSecretValid(watchedKafkaRequest)) {
      return (
        <ServicesErrorState
          title={t('rhoas-plugin~Could not fetch services')}
          message={t('rhoas-plugin~Could not connect to RHOAS with API Token')}
          actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
        />
      );
    }
    return (
      <ServicesErrorState
        title={t('rhoas-plugin~Could not fetch services')}
        message={t('rhoas-plugin~Failed to load list of services', {
          error: getFinishedCondition(watchedKafkaRequest)?.message,
        })}
        actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
      />
    );
  }

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <ServiceInstance
        kafkaArray={remoteKafkaInstances}
        selectedKafka={selectedKafka}
        setSelectedKafka={setSelectedKafka}
        currentKafkaConnections={currentKafkaConnections}
        createKafkaConnectionFlow={createKafkaConnectionFlow}
        isSubmitting={isSubmitting}
      />
    </NamespacedPage>
  );
};

export default ServiceListPage;
