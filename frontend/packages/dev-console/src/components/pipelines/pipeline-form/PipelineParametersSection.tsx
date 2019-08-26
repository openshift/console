import * as React from 'react';
import { FieldArray } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import FormSection from '../../import/section/FormSection';
import { InputField } from '../../formik-fields';

// add parameters props
export const PipelineParametersSection: React.FC<any> = ({ parameters }) => (
  <FieldArray
    name="parameters"
    key="parameters-row"
    render={(helpers) => (
      <>
        {parameters.length > 0 && (
          <FormSection title="Parameters" fullWidth>
            {parameters.map((parameter, index) => (
              <div className="form-group" key={`${parameter}-row-group`}>
                <InputField
                  name={`parameters.${index}.default`}
                  type={TextInputTypes.text}
                  label={parameter.name}
                  helpText={parameter.description}
                  placeholder="Name"
                />
              </div>
            ))}
          </FormSection>
        )}
      </>
    )}
  />
);
