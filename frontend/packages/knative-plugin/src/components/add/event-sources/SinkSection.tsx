import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { getFieldId, ResourceDropdownField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { EventingBrokerModel } from '../../../models';
import {
  knativeServingResourcesServices,
  knativeEventingResourcesBroker,
} from '../../../utils/get-knative-resources';
import { getDynamicChannelResourceList } from '../../../utils/fetch-dynamic-eventsources-utils';

interface SinkSectionProps {
  namespace: string;
}

const SinkSection: React.FC<SinkSectionProps> = ({ namespace }) => {
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      if (selectedValue && modelData) {
        const { apiGroup, apiVersion, kind } = modelData;
        setFieldValue('sink.name', selectedValue);
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
  const contextAvailable = !!initialValues.sink.name;
  const resourcesData = [
    ...knativeServingResourcesServices(namespace),
    ...getDynamicChannelResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];

  // filter out channels backing brokers
  const resourceFilter = (resource: K8sResourceKind) => {
    const {
      metadata: { ownerReferences },
    } = resource;
    return !ownerReferences?.length || ownerReferences[0].kind !== EventingBrokerModel.kind;
  };
  return (
    <FormSection
      title="Sink"
      subTitle="Add a sink to route this event source to a Channel, Broker or Knative service."
      extraMargin
    >
      <FormGroup
        fieldId={fieldId}
        helperText={!contextAvailable ? 'This resource will be the sink for the event source.' : ''}
        isRequired
      >
        <ResourceDropdownField
          name="sink.name"
          label="Resource"
          resources={resourcesData}
          dataSelector={['metadata', 'name']}
          fullWidth
          required
          placeholder="Select resource"
          showBadge
          disabled={contextAvailable}
          onChange={onChange}
          autocompleteFilter={autocompleteFilter}
          autoSelect
          resourceFilter={resourceFilter}
        />
      </FormGroup>
    </FormSection>
  );
};

export default SinkSection;
