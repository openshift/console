import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { getFieldId } from '@console/shared';
import { Dropdown, ResourceIcon } from '@console/internal/components/utils';
import {
  referenceForModel,
  K8sKind,
  modelFor,
  referenceFor,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

type DropdownItemProps = {
  model: K8sKind;
  name: string;
};

const DropdownItem: React.FC<DropdownItemProps> = ({ model, name }) => (
  <span className="co-resource-item">
    <span className="co-resource-icon--fixed-width">
      <ResourceIcon kind={referenceForModel(model)} />
    </span>
    <span className="co-resource-item__resource-name">
      <span className="co-resource-item__resource-api co-truncate show co-nowrap small">
        {name}
      </span>
    </span>
  </span>
);

export interface SinkSectionProps {
  services: K8sResourceKind[];
}

const SinkSection: React.FC<SinkSectionProps> = ({ services }) => {
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const allItems = _.reduce(
    services,
    (acc, itemData) => {
      const svcName = _.get(itemData, 'metadata.name');
      return {
        ...acc,
        [svcName]: (
          <DropdownItem
            key={itemData.metadata.uid}
            model={modelFor(referenceFor(itemData))}
            name={itemData.metadata.name}
          />
        ),
      };
    },
    {},
  );

  const onChange = (selectedValue) => {
    if (selectedValue) {
      setFieldTouched('sink.knativeService', true);
      setFieldValue('sink.knativeService', selectedValue);
      validateForm();
    }
  };

  return (
    <FormSection title="Sink">
      <FormGroup
        fieldId={fieldId}
        label="Knative Service"
        helperText="Select a Service to sink to."
        isRequired
      >
        <Dropdown
          autocompleteFilter={autocompleteFilter}
          items={allItems}
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          onChange={onChange}
          title="Select Service"
          autocompletePlaceholder="Select a service"
        />
      </FormGroup>
    </FormSection>
  );
};

export default SinkSection;
