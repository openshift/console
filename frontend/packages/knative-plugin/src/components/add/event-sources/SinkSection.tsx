import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { getFieldId } from '@console/shared';
import { Dropdown, ResourceIcon } from '@console/internal/components/utils';
import { referenceForModel, K8sKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

type DropdownItemProps = {
  model: K8sKind;
  name: string;
};

const DropdownItem: React.FC<DropdownItemProps> = ({ model, name }) => (
  <>
    <span className={'co-resource-item'}>
      <span className="co-resource-icon--fixed-width">
        <ResourceIcon kind={referenceForModel(model)} />
      </span>
      <span className="co-resource-item__resource-name">
        <span className="co-resource-item__resource-api text-muted co-truncate show co-nowrap small">
          {name}
        </span>
      </span>
    </span>
  </>
);

export interface SinkSectionProps {
  services: any;
}

const SinkSection: React.FC<SinkSectionProps> = ({ services }) => {
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const title = 'Select Service';
  const autocompleteFilter = (strText, item) => {
    return fuzzy(strText, item?.props?.name);
  };
  const fieldId = getFieldId('sink-name', 'dropdown');
  const servicesData = services?.data;
  const allItems = _.reduce(
    servicesData,
    (acc, itemData) => {
      const svcName = _.get(itemData, 'metadata.name');
      return {
        ...acc,
        [svcName]: (
          <DropdownItem
            key={itemData.metadata.uuid}
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
        label="Kantive Service"
        helperText="Select an Service to sink to."
        isRequired
      >
        <Dropdown
          autocompleteFilter={autocompleteFilter}
          items={allItems}
          dropDownClassName="odc-metrics-query-input dropdown--full-width"
          menuClassName="odc-metrics-query-input__menu dropdown-menu--text-wrap"
          onChange={onChange}
          title={title}
          autocompletePlaceholder="Select Resource"
        />
      </FormGroup>
    </FormSection>
  );
};

export default SinkSection;
