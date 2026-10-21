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
import { useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import { EventingBrokerModel } from '../../../../models';
import { useChannelModels } from '../../../../utils/fetch-dynamic-eventsources-utils';
import { craftResourceKey } from '../../../pub-sub/pub-sub-utils';

export interface SourceResourcesProps {
  namespace: string;
  isMoveSink?: boolean;
}

const SourceResources: FC<SourceResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  const [resourceAlert, setResourceAlert] = useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();

  // Get dynamic channel models
  const { loaded: channelsLoaded, eventSourceChannels: channels } = useChannelModels();

  const watchSpec = useMemo(() => {
    const spec: Record<string, WatchK8sResource> = {
      brokers: {
        isList: true,
        kind: referenceForModel(EventingBrokerModel),
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

    // Add broker resources
    if (watchedResources.brokers) {
      result.push({
        data: watchedResources.brokers.data,
        loaded: watchedResources.brokers.loaded,
        loadError: watchedResources.brokers.loadError,
        kind: EventingBrokerModel.kind,
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

  const autocompleteFilter = (strText: string, item: ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('source-name', 'dropdown');
  const onChange = useCallback(
    (_selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      const name = valueObj?.props?.name;
      if (name && modelData) {
        const { apiGroup = 'core', apiVersion, kind } = modelData;
        setFieldValue('formData.source.name', name);
        setFieldTouched('formData.source.name', true);
        setFieldValue('formData.source.apiVersion', `${apiGroup}/${apiVersion}`);
        setFieldTouched('formData.source.apiVersion', true);
        setFieldValue('formData.source.kind', kind);
        setFieldTouched('formData.source.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = isMoveSink ? false : !!initialValues.formData.source.name;

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (isEmpty(resourceList)) {
      setResourceAlert(true);
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
            {t('knative-plugin~Exit this form and create a Broker, or Channel first.')}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        key={resourcesData.length === 0 ? 'no-resources' : 'resources'}
        menuClassName={'max-height-menu'}
        data-test="sourcable-resources"
        name="formData.source.key"
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
              {t('knative-plugin~This resource will be the source for the Event sink.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default SourceResources;
