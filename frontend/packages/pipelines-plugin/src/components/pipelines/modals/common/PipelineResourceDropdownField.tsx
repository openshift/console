import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { DropdownFieldProps, useFormikValidationFix } from '@console/shared';
import PipelineResourceParam from '../../pipeline-resource/PipelineResourceParam';
import { CREATE_PIPELINE_RESOURCE } from './const';
import PipelineResourceDropdown from './PipelineResourceDropdown';
import { PipelineModalFormResource } from './types';

type PipelineResourceDropdownFieldProps = DropdownFieldProps & {
  filterType?: string;
};
const PipelineResourceDropdownField: React.FC<PipelineResourceDropdownFieldProps> = (props) => {
  const { filterType, name, label } = props;

  const [field] = useField<PipelineModalFormResource>(name);
  const { values } = useFormikContext<FormikValues>();
  const { namespace } = values;
  const {
    value: { selection },
  } = field;
  const creating = selection === CREATE_PIPELINE_RESOURCE;

  useFormikValidationFix(field.value);

  return (
    <>
      <FormGroup fieldId={name} label={label} isRequired>
        <PipelineResourceDropdown
          {...props}
          autoSelect={selection === ''}
          filterType={filterType}
          namespace={namespace}
          name={`${name}.selection`}
        />
      </FormGroup>

      {creating && <PipelineResourceParam name={`${name}.data`} type={filterType} />}
    </>
  );
};

export default PipelineResourceDropdownField;
