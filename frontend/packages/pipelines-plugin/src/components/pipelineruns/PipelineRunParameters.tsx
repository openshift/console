import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField } from '@console/shared';

type PipelineRunParametersProps = {
  addLabel?: string;
  nameLabel: string;
  nameFieldName: string;
  valueLabel: string;
  valueFieldName: string;
  emptyMessage: string;
  fieldName: string;
  emptyValues: { [name: string]: string };
  isReadOnly?: boolean;
};

const PipelineRunParameters: React.FC<PipelineRunParametersProps> = ({
  addLabel,
  nameLabel,
  nameFieldName,
  valueLabel,
  valueFieldName,
  emptyMessage,
  fieldName,
  emptyValues,
  isReadOnly = false,
}) => {
  return (
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-parameters"
        name={fieldName}
        addLabel={addLabel}
        headers={[
          {
            name: nameLabel,
            required: true,
          },
          valueLabel,
        ]}
        emptyValues={emptyValues}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
      >
        <InputField
          data-test={nameFieldName}
          name={nameFieldName}
          type={TextInputTypes.text}
          placeholder={nameLabel}
          isDisabled={isReadOnly}
          aria-label={nameLabel}
        />
        <InputField
          data-test={valueFieldName}
          name={valueFieldName}
          type={TextInputTypes.text}
          placeholder={valueLabel}
          isDisabled={isReadOnly}
          aria-label={valueLabel}
        />
      </MultiColumnField>
    </div>
  );
};

export default PipelineRunParameters;
