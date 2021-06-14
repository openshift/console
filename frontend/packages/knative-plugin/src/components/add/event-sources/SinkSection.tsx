import * as React from 'react';
import { FormGroup, TextInputTypes, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { InputField, getFieldId, ResourceDropdownField, RadioGroupField } from '@console/shared';
import { EventingBrokerModel, EventingChannelModel } from '../../../models';
import { getDynamicChannelResourceList } from '../../../utils/fetch-dynamic-eventsources-utils';
import {
  knativeServingResourcesServices,
  knativeEventingResourcesBroker,
} from '../../../utils/get-knative-resources';
import { sourceSinkType, SinkType } from '../import-types';

interface SinkSectionProps {
  namespace: string;
  fullWidth?: boolean;
}

interface SinkResourcesProps {
  namespace: string;
  isMoveSink?: boolean;
}

const SinkUri: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FormGroup
      fieldId={getFieldId('sink-name', 'uri')}
      helperText={t(
        'knative-plugin~A Universal Resource Indicator where events are going to be delivered. Ex. "http://cluster.example.com/svc"',
      )}
      isRequired
    >
      <InputField
        type={TextInputTypes.text}
        name="formData.sink.uri"
        placeholder={t('knative-plugin~Enter URI')}
        data-test-id="sink-section-uri"
        required
      />
    </FormGroup>
  );
};

const SinkResources: React.FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();
  const [, { touched: sinkTypeTouched }] = useField('formData.sinkType');
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      const name = valueObj?.props?.name;
      if (name && modelData) {
        const { apiGroup, apiVersion, kind } = modelData;
        setFieldValue('formData.sink.name', name);
        setFieldTouched('formData.sink.name', true);
        setFieldValue('formData.sink.apiVersion', `${apiGroup}/${apiVersion}`);
        setFieldTouched('formData.sink.apiVersion', true);
        setFieldValue('formData.sink.kind', kind);
        setFieldTouched('formData.sink.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = isMoveSink ? false : !!initialValues.formData.sink.name;
  const resourcesData = [
    ...knativeServingResourcesServices(namespace),
    ...getDynamicChannelResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (_.isEmpty(resourceList)) {
      setResourceAlert(true);
      if (!sinkTypeTouched) {
        setFieldValue('formData.sinkType', SinkType.Uri);
        setFieldTouched('formData.sinkType', true);
      }
    } else {
      setResourceAlert(false);
    }
  };

  // filter out channels backing brokers
  const resourceFilter = (resource: K8sResourceKind) => {
    const {
      metadata: { ownerReferences },
    } = resource;
    return (
      !ownerReferences?.length ||
      ![EventingChannelModel.kind, EventingBrokerModel.kind].includes(ownerReferences[0].kind)
    );
  };

  return (
    <FormGroup
      fieldId={fieldId}
      helperText={
        !contextAvailable
          ? t('knative-plugin~This resource will be the sink for the Event source.')
          : ''
      }
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="default" title={t('knative-plugin~No resources available')} isInline>
            {t(
              'knative-plugin~Select the URI option, or exit this form and create a Knative Service, Broker, or Channel first.',
            )}
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
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
        customResourceKey={(key: string, resource: K8sResourceKind) => {
          const { kind } = resource;
          return key ? `${kind}-${key}` : undefined;
        }}
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
      />
    </FormGroup>
  );
};

export const SinkUriResourcesGroup: React.FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  return (
    <RadioGroupField
      name="formData.sinkType"
      options={[
        {
          label: sourceSinkType(t).Resource.label,
          value: sourceSinkType(t).Resource.value,
          activeChildren: <SinkResources namespace={namespace} isMoveSink={isMoveSink} />,
        },
        {
          label: sourceSinkType(t).Uri.label,
          value: sourceSinkType(t).Uri.value,
          activeChildren: <SinkUri />,
        },
      ]}
    />
  );
};

const SinkSection: React.FC<SinkSectionProps> = ({ namespace, fullWidth }) => {
  const { t } = useTranslation();
  return (
    <FormSection
      title={t('knative-plugin~Sink')}
      subTitle={t(
        'knative-plugin~Add a sink to route this Event source to a Channel, Broker, Knative Service or another route.',
      )}
      extraMargin
      fullWidth={fullWidth}
    >
      <SinkUriResourcesGroup namespace={namespace} />
    </FormSection>
  );
};

export default SinkSection;
