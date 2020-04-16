import * as React from 'react';
import { RadioGroup } from '@console/internal/components/radio';
import './styles.scss';

export enum EditorType {
  Form = 'form',
  YAML = 'yaml',
}

export const EditorToggle: React.FC<EditorToggleProps> = ({ value, onChange }) => {
  return (
    <div className="co-synced-editor__editor-toggle">
      <RadioGroup
        label="Configure via:"
        currentValue={value}
        inline
        items={[
          {
            value: EditorType.Form,
            title: 'Form View',
          },
          {
            value: EditorType.YAML,
            title: 'YAML View',
          },
        ]}
        onChange={({ currentTarget }) => onChange(currentTarget.value as EditorType)}
      />
    </div>
  );
};

type EditorToggleProps = {
  value: EditorType;
  onChange?: (newValue: EditorType) => void;
};
