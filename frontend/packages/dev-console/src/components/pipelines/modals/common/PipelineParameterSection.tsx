import * as React from 'react';
import { FieldArray } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import FormSection from '../../../import/section/FormSection';

export interface ParamertersSectionProps {
  parameters: {
    name: string;
    description?: string;
    default: string;
  }[];
}

const PipelineParameterSection: React.FC<ParamertersSectionProps> = ({ parameters }) => (
  <FieldArray
    name="parameters"
    key="parameters-row"
    render={() =>
      parameters.length > 0 && (
        <FormSection title="Parameters" fullWidth>
          {parameters.map((parameter, index) => (
            <div
              className="form-group"
              // eslint-disable-next-line react/no-array-index-key
              key={`${parameter.name}-${index}`}
            >
              <InputField
                name={`parameters.${index}.default`}
                type={TextInputTypes.text}
                label={parameter.name}
                helpText={parameter.description}
                placeholder="Name"
                required
              />
            </div>
          ))}
        </FormSection>
      )
    }
  />
);

export default PipelineParameterSection;
