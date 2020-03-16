import * as React from 'react';
import { RadioGroup, RadioGroupProps } from '@console/internal/components/radio';

export enum EditorType {
  Form = 'form',
  YAML = 'yaml',
}

export const EditorToggle: React.FC<EditorToggleProps> = ({ value, onChange }) => {
  return (
    <div className="co-create-operand__editor-toggle">
      <RadioGroup
        label="Configure via:"
        currentValue={value}
        inline
        items={[
          {
            value: EditorType.Form,
            title: 'Form view',
          },
          {
            value: EditorType.YAML,
            title: 'YAML View',
          },
        ]}
        onChange={onChange}
      />
    </div>
  );
};

type EditorToggleProps = {
  value: EditorType;
  onChange: RadioGroupProps['onChange'];
};
