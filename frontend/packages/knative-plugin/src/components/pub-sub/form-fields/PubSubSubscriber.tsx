import * as React from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { FormGroup, Alert } from '@patternfly/react-core';
import { ResourceDropdownField, getFieldId } from '@console/shared';
import { useFormikContext, FormikValues } from 'formik';
import { knativeServingResourcesServices } from '../../../utils/get-knative-resources';

const PubSubSubscriber: React.FC = () => {
  const { values, setFieldValue, setFieldTouched, validateForm, setStatus } = useFormikContext<
    FormikValues
  >();
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const onSubscriberChange = React.useCallback(
    (selectedValue, target) => {
      const modelResource = target?.props?.model;
      if (selectedValue) {
        setFieldTouched('spec.subscriber.ref.name', true);
        setFieldValue('spec.subscriber.ref.name', selectedValue);
        if (modelResource) {
          const { apiGroup, apiVersion, kind } = modelResource;
          const sinkApiversion = `${apiGroup}/${apiVersion}`;
          setFieldValue('spec.subscriber.ref.apiVersion', sinkApiversion);
          setFieldTouched('spec.subscriber.ref.apiVersion', true);
          setFieldValue('spec.subscriber.ref.kind', kind);
          setFieldTouched('spec.subscriber.ref.kind', true);
        }
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );

  React.useEffect(() => {
    setStatus({ subscriberAvailable: !resourceAlert });
  }, [resourceAlert, setStatus]);

  const handleOnLoad = (resourceList: { [key: string]: string }) => {
    setResourceAlert(_.isEmpty(resourceList));
  };

  const dropdownResources = knativeServingResourcesServices(values.metadata.namespace);
  return (
    <FormGroup fieldId={getFieldId('pubsub', 'subscriber')} label="Subscriber" isRequired>
      {resourceAlert && (
        <>
          <Alert variant="default" title="No Subscriber available" isInline>
            To create a Subscriber create, a Knative Service from the Add page.
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        name="spec.subscriber.ref.name"
        resources={dropdownResources}
        dataSelector={['metadata', 'name']}
        fullWidth
        required
        placeholder="Select Subscriber"
        showBadge
        autocompleteFilter={autocompleteFilter}
        onChange={onSubscriberChange}
        autoSelect
        disabled={resourceAlert}
        onLoad={handleOnLoad}
      />
    </FormGroup>
  );
};

export default PubSubSubscriber;
