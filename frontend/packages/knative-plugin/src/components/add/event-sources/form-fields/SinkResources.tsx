import type { FC, ReactElement } from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  FormGroup,
  Alert,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext, useField } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import {
  ServiceModel as KnativeServiceModel,
  EventingBrokerModel,
  KafkaSinkModel,
} from '../../../../models';
import { useChannelModels } from '../../../../utils/fetch-dynamic-eventsources-utils';
import { craftResourceKey } from '../../../pub-sub/pub-sub-utils';
import { SinkType } from '../../import-types';

import './SinkResources.scss';

export interface SinkResourcesProps {
  namespace: string;
  isMoveSink?: boolean;
}

const SinkResources: FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  const [resourceAlert, setResourceAlert] = useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();
  const [, { touched: sinkTypeTouched }] = useField('formData.sinkType');
  const autocompleteFilter = (strText: string, item: ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = useCallback(
    (_selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      const name = valueObj?.props?.name;
      if (name && modelData) {
        const { apiGroup, apiVersion, kind } = modelData;
        setFieldValue('formData.sink.name', name);
        setFieldTouched('formData.sink.name', true);
        setFieldValue(
          'formData.sink.apiVersion',
          apiGroup ? `${apiGroup}/${apiVersion}` : apiVersion,
        );
        setFieldTouched('formData.sink.apiVersion', true);
        setFieldValue('formData.sink.kind', kind);
        setFieldTouched('formData.sink.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = isMoveSink ? false : !!initialValues.formData.sink.name;

  // Get dynamic channel models
  const { loaded: channelsLoaded, eventSourceChannels: channels } = useChannelModels();

  // Build watch spec for static resources
  const watchSpec = useMemo(() => {
    const spec: Record<string, any> = {
      services: {
        isList: true,
        kind: 'Service',
        namespace,
        optional: true,
      },
      ksservices: {
        isList: true,
        kind: referenceForModel(KnativeServiceModel),
        namespace,
        optional: true,
      },
      brokers: {
        isList: true,
        kind: referenceForModel(EventingBrokerModel),
        namespace,
        optional: true,
      },
      kafkasinks: {
        isList: true,
        kind: referenceForModel(KafkaSinkModel),
        namespace,
        optional: true,
      },
    };

    // Add dynamic channels when loaded
    if (channelsLoaded && channels.length > 0) {
      channels.forEach((model) => {
        const ref = referenceForModel(model);
        spec[ref] = {
          isList: true,
          kind: ref,
          namespace,
          optional: true,
        };
      });
    }

    return spec;
  }, [namespace, channelsLoaded, channels]);

  const watchedResources = useK8sWatchResources<Record<string, K8sResourceKind[]>>(watchSpec);

  // Transform watched resources to expected format
  const resourcesData = useMemo(() => {
    const result = [];

    // Add static resources
    if (watchedResources.services) {
      result.push({
        data: watchedResources.services.data,
        loaded: watchedResources.services.loaded,
        loadError: watchedResources.services.loadError,
        kind: 'Service',
      });
    }
    if (watchedResources.ksservices) {
      result.push({
        data: watchedResources.ksservices.data,
        loaded: watchedResources.ksservices.loaded,
        loadError: watchedResources.ksservices.loadError,
        kind: KnativeServiceModel.kind,
      });
    }
    if (watchedResources.brokers) {
      result.push({
        data: watchedResources.brokers.data,
        loaded: watchedResources.brokers.loaded,
        loadError: watchedResources.brokers.loadError,
        kind: EventingBrokerModel.kind,
      });
    }
    if (watchedResources.kafkasinks) {
      result.push({
        data: watchedResources.kafkasinks.data,
        loaded: watchedResources.kafkasinks.loaded,
        loadError: watchedResources.kafkasinks.loadError,
        kind: KafkaSinkModel.kind,
      });
    }

    // Add dynamic channel resources
    if (channelsLoaded && channels.length > 0) {
      channels.forEach((model) => {
        const ref = referenceForModel(model);
        if (watchedResources[ref]) {
          result.push({
            data: watchedResources[ref].data,
            loaded: watchedResources[ref].loaded,
            loadError: watchedResources[ref].loadError,
            kind: model.kind,
          });
        }
      });
    }

    return result;
  }, [watchedResources, channelsLoaded, channels]);

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (isEmpty(resourceList)) {
      setResourceAlert(true);
      if (!sinkTypeTouched) {
        setFieldValue('formData.sinkType', SinkType.Uri);
        setFieldTouched('formData.sinkType', true);
      }
    } else {
      setResourceAlert(false);
    }
  };

  // filter out resource which are owned by other resource
  const resourceFilter = ({ metadata }: K8sResourceKind) => !metadata?.ownerReferences?.length;

  return (
    <FormGroup fieldId={fieldId} isRequired>
      {resourceAlert && (
        <>
          <Alert variant="custom" title={t('knative-plugin~No resources available')} isInline>
            {t(
              'knative-plugin~Select the URI option, or exit this form and create a Knative Service, Broker, or Channel first.',
            )}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        menuClassName={'max-height-menu'}
        data-test="sinkable-resources"
        name="formData.sink.key"
        resources={resourcesData}
        dataSelector={['metadata', 'name']}
        fullWidth
        placeholder={t('knative-plugin~Select resource')}
        showBadge
        disabled={contextAvailable || resourceAlert}
        onChange={onChange}
        autocompleteFilter={autocompleteFilter}
        autoSelect
        customResourceKey={craftResourceKey}
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
      />

      {!contextAvailable && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t('knative-plugin~This resource will be the sink for the Event source.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default SinkResources;
