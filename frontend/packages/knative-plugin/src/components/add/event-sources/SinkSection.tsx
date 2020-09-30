import * as React from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup, TextInputTypes, Alert } from '@patternfly/react-core';
import { InputField, getFieldId, ResourceDropdownField, RadioGroupField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { EventingBrokerModel, EventingChannelModel } from '../../../models';
import {
  knativeServingResourcesServices,
  knativeEventingResourcesBroker,
} from '../../../utils/get-knative-resources';
import { getDynamicChannelResourceList } from '../../../utils/fetch-dynamic-eventsources-utils';
import { sourceSinkType, SinkType } from '../import-types';

interface SinkSectionProps {
  namespace: string;
}

interface SinkResourcesProps {
  namespace: string;
  isMoveSink?: boolean;
}

const SinkUri: React.FC = () => (
  <FormGroup
    fieldId={getFieldId('sink-name', 'uri')}
    helperText={`A Universal Resource Indicator where events are going to be delivered. Ex.
    "http://cluster.example.com/svc"`}
    isRequired
  >
    <InputField
      type={TextInputTypes.text}
      name="sink.uri"
      placeholder="Enter URI"
      data-test-id="sink-section-uri"
      required
    />
  </FormGroup>
);

const SinkResources: React.FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues, touched } = useFormikContext<
    FormikValues
  >();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      const name = valueObj?.props?.name;
      if (name && modelData) {
        const { apiGroup, apiVersion, kind } = modelData;
        setFieldValue('sink.name', name);
        setFieldTouched('sink.name', true);
        setFieldValue('sink.apiVersion', `${apiGroup}/${apiVersion}`);
        setFieldTouched('sink.apiVersion', true);
        setFieldValue('sink.kind', kind);
        setFieldTouched('sink.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = isMoveSink ? false : !!initialValues.sink.name;
  const resourcesData = [
    ...knativeServingResourcesServices(namespace),
    ...getDynamicChannelResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    if (_.isEmpty(resourceList)) {
      setResourceAlert(true);
      if (!touched.sinkType) {
        setFieldValue('sinkType', SinkType.Uri);
        setFieldTouched('sinkType', true);
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
      helperText={!contextAvailable ? 'This resource will be the Sink for the Event Source.' : ''}
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="default" title="No resources available" isInline>
            Select the URI option, or exit this form and create a Knative Service, Broker, or
            Channel first.
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        name="sink.key"
        resources={resourcesData}
        dataSelector={['metadata', 'name']}
        fullWidth
        placeholder="Select resource"
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

export const SinkUriResourcesGroup: React.FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => (
  <RadioGroupField
    name="sinkType"
    options={[
      {
        label: sourceSinkType.Resource.label,
        value: sourceSinkType.Resource.value,
        activeChildren: <SinkResources namespace={namespace} isMoveSink={isMoveSink} />,
      },
      {
        label: sourceSinkType.Uri.label,
        value: sourceSinkType.Uri.value,
        activeChildren: <SinkUri />,
      },
    ]}
  />
);

const SinkSection: React.FC<SinkSectionProps> = ({ namespace }) => {
  return (
    <FormSection
      title="Sink"
      subTitle="Add a Sink to route this Event Source to a Channel, Broker, Knative Service or another route."
      extraMargin
    >
      <SinkUriResourcesGroup namespace={namespace} />
    </FormSection>
  );
};

export default SinkSection;
