import type { FC } from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ServiceModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { getFieldId } from '@console/shared/src/components/formik-fields/field-utils';
import ResourceDropdownField from '@console/shared/src/components/formik-fields/ResourceDropdownField';
import { ServiceModel as KnativeServiceModel, KafkaSinkModel } from '../../../models';
import { craftResourceKey } from '../pub-sub-utils';

type PubSubSubscriberProps = {
  autoSelect?: boolean;
  cancel?: () => void;
};

const PubSubSubscriber: FC<PubSubSubscriberProps> = ({ autoSelect = true, cancel }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched, validateForm, setStatus } = useFormikContext<
    FormikValues
  >();
  const { namespace } = values.formData.metadata;
  const [resourceAlert, setResourceAlert] = useState(false);
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const onSubscriberChange = useCallback(
    (selectedValue, target) => {
      const modelResource = target?.props?.model;
      if (selectedValue) {
        setFieldTouched('formData.spec.subscriber.ref.name', true);
        setFieldValue('formData.spec.subscriber.ref.name', selectedValue);
        if (modelResource) {
          const { apiGroup = 'core', apiVersion, kind } = modelResource;
          const sinkApiversion = `${apiGroup}/${apiVersion}`;
          setFieldValue('formData.spec.subscriber.ref.apiVersion', sinkApiversion);
          setFieldTouched('formData.spec.subscriber.ref.apiVersion', true);
          setFieldValue('formData.spec.subscriber.ref.kind', kind);
          setFieldTouched('formData.spec.subscriber.ref.kind', true);
        }
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );

  useEffect(() => {
    setStatus({ subscriberAvailable: !resourceAlert });
  }, [resourceAlert, setStatus]);

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    setResourceAlert(_.isEmpty(resourceList));
  };

  const watchSpec = useMemo(
    () =>
      namespace
        ? {
            services: {
              isList: true,
              kind: referenceForModel(ServiceModel),
              namespace,
              optional: true,
            },
            ksservices: {
              isList: true,
              kind: referenceForModel(KnativeServiceModel),
              namespace,
              optional: true,
            },
            kafkasinks: {
              isList: true,
              kind: referenceForModel(KafkaSinkModel),
              namespace,
              optional: true,
            },
          }
        : {},
    [namespace],
  );

  const watchedResources = useK8sWatchResources<{
    services?: K8sResourceKind[];
    ksservices?: K8sResourceKind[];
    kafkasinks?: K8sResourceKind[];
  }>(watchSpec);

  const resources = useMemo(
    () =>
      namespace
        ? [
            {
              data: watchedResources.services?.data,
              loaded: watchedResources.services?.loaded,
              loadError: watchedResources.services?.loadError,
              kind: referenceForModel(ServiceModel),
            },
            {
              data: watchedResources.ksservices?.data,
              loaded: watchedResources.ksservices?.loaded,
              loadError: watchedResources.ksservices?.loadError,
              kind: referenceForModel(KnativeServiceModel),
            },
            {
              data: watchedResources.kafkasinks?.data,
              loaded: watchedResources.kafkasinks?.loaded,
              loadError: watchedResources.kafkasinks?.loadError,
              kind: referenceForModel(KafkaSinkModel),
            },
          ]
        : [],
    [
      namespace,
      watchedResources.services?.data,
      watchedResources.services?.loaded,
      watchedResources.services?.loadError,
      watchedResources.ksservices?.data,
      watchedResources.ksservices?.loaded,
      watchedResources.ksservices?.loadError,
      watchedResources.kafkasinks?.data,
      watchedResources.kafkasinks?.loaded,
      watchedResources.kafkasinks?.loadError,
    ],
  );

  // filter out resource which are owned by other resource
  const resourceFilter = ({ metadata }: K8sResourceKind) => !metadata?.ownerReferences?.length;

  return (
    <FormGroup
      fieldId={getFieldId('pubsub', 'subscriber')}
      label={t('knative-plugin~Subscriber')}
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="custom" title={t('knative-plugin~No Subscriber available')} isInline>
            <Trans t={t} ns="knative-plugin">
              {'To create a Subscriber, first create a Knative Service from the '}
              <Link
                to={`/add/ns/${namespace}`}
                onClick={() => {
                  cancel && cancel();
                }}
              >
                {'Add page'}
              </Link>
              .
            </Trans>
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        name="formData.spec.subscriber.ref.name"
        resources={resources}
        dataSelector={['metadata', 'name']}
        fullWidth
        required
        placeholder={t('knative-plugin~Select Subscriber')}
        showBadge
        autocompleteFilter={autocompleteFilter}
        onChange={onSubscriberChange}
        customResourceKey={craftResourceKey}
        disabled={resourceAlert}
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
        autoSelect={autoSelect}
      />
    </FormGroup>
  );
};

export default PubSubSubscriber;
