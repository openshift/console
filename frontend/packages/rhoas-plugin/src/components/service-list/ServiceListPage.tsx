import * as React from 'react';
import { FormGroup, Title, Split, SplitItem } from '@patternfly/react-core';
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { history, LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  FormHeader,
  FlexForm,
  FormBody,
  useActiveNamespace,
  TechPreviewBadge,
} from '@console/shared';
import { ServicesRequestCRName } from '../../const';
import { CloudServicesRequestModel } from '../../models/rhoas';
import {
  isResourceStatusSuccessful,
  isAccessTokenSecretValid,
  getFinishedCondition,
} from '../../utils/conditionHandler';
import {
  createKafkaConnection,
  createCloudServicesRequestIfNeeded,
  deleteKafkaConnection,
  listOfCurrentKafkaConnectionsById,
} from '../../utils/resourceCreators';
import { KafkaRequest } from '../../utils/rhoas-types';
import { ServicesEmptyState } from '../states';
import ServiceInstance from './ServiceInstance';

type ConnectionErrorProps = {
  title: string;
  message: string;
  action: () => void;
  actionLabel: string;
};

const ServiceListPage: React.FC = () => {
  const [currentNamespace] = useActiveNamespace();
  const [selectedKafka, setSelectedKafka] = React.useState<number>();
  const [currentKafkaConnections, setCurrentKafkaConnections] = React.useState<string[]>();
  const [isSubmitting, setSubmitting] = React.useState<boolean>(false);
  const [connectionError, setConnectionError] = React.useState<ConnectionErrorProps>();

  const { t } = useTranslation();

  React.useEffect(() => {
    const createKafkaRequestFlow = async () => {
      try {
        await createCloudServicesRequestIfNeeded(currentNamespace);
        const currentKafka = await listOfCurrentKafkaConnectionsById(currentNamespace);
        if (currentKafka) {
          setCurrentKafkaConnections(currentKafka);
        }
      } catch (error) {
        const connectionErrorObj = {
          title: t('rhoas-plugin~Could not fetch services'),
          message: t('rhoas-plugin~Failed to load list of services', {
            error,
          }),
          action: () => history.push(`/catalog/ns/${currentNamespace}?catalogType=managedservices`),
          actionLabel: t('rhoas-plugin~Go back to Services Catalog'),
        };
        setConnectionError(connectionErrorObj);
      }
    };
    createKafkaRequestFlow();
  }, [currentNamespace, t]);

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

      const connectionErrorObj = {
        title: t('rhoas-plugin~Failed to create connection'),
        message: t('rhoas-plugin~Please try again', {
          error,
        }),
        action: () => history.push(`/catalog/ns/${currentNamespace}?catalogType=managedservices`),
        actionLabel: t('rhoas-plugin~Go back to Services Catalog'),
      };
      setConnectionError(connectionErrorObj);

      setSubmitting(false);
    }
  }, [currentNamespace, remoteKafkaInstances, selectedKafka, t]);

  if (
    !watchedKafkaRequest ||
    !watchedKafkaRequest.status ||
    currentKafkaConnections === undefined
  ) {
    return <LoadingBox />;
  }

  const title = (
    <Split className="odc-form-section-pipeline" hasGutter>
      <SplitItem className="odc-form-section__heading">
        <Title headingLevel="h1" size="2xl">
          {t('rhoas-plugin~Select Kafka Instance')}
        </Title>
      </SplitItem>
      <SplitItem>
        <TechPreviewBadge />
      </SplitItem>
    </Split>
  );

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <FlexForm>
        <FormBody>
          <FormHeader
            title={title}
            helpText={t(
              'rhoas-plugin~The selected Kafka instance will be added to the topology view.',
            )}
          />
        </FormBody>
        {!isResourceStatusSuccessful(watchedKafkaRequest) &&
        !isAccessTokenSecretValid(watchedKafkaRequest) ? (
          <FormGroup fieldId="emptystate1">
            <ServicesEmptyState
              title={t('rhoas-plugin~Could not fetch services')}
              message={t('rhoas-plugin~Could not connect to RHOAS with API Token')}
              action={() =>
                history.push(`/catalog/ns/${currentNamespace}?catalogType=managedservices`)
              }
              actionLabel={t('rhoas-plugin~Go back to Services Catalog')}
              icon={TimesCircleIcon}
            />
          </FormGroup>
        ) : !isResourceStatusSuccessful(watchedKafkaRequest) ? (
          <FormGroup fieldId="emptystate2">
            <FormSection fullWidth>
              <ServicesEmptyState
                title={t('rhoas-plugin~Could not fetch services')}
                message={t('rhoas-plugin~Failed to load list of services', {
                  error: getFinishedCondition(watchedKafkaRequest)?.message,
                })}
                action={() =>
                  history.push(`/catalog/ns/${currentNamespace}?catalogType=managedservices`)
                }
                actionLabel={'rhoas-plugin~Go back to Services Catalog'}
                icon={TimesCircleIcon}
              />
            </FormSection>
          </FormGroup>
        ) : (
          <ServiceInstance
            kafkaArray={remoteKafkaInstances}
            selectedKafka={selectedKafka}
            setSelectedKafka={setSelectedKafka}
            currentKafkaConnections={currentKafkaConnections}
            createKafkaConnectionFlow={createKafkaConnectionFlow}
            isSubmitting={isSubmitting}
            currentNamespace={currentNamespace}
            connectionError={connectionError}
          />
        )}
      </FlexForm>
    </NamespacedPage>
  );
};

export default ServiceListPage;
