import * as React from 'react';

export interface PipelineResourceDropdownFieldMockProps {
  label: string;
}
const PipelineResourceDropdownField: React.FC<PipelineResourceDropdownFieldMockProps> = (props) => {
  return <div>{props.label} dropdown</div>;
};

export default PipelineResourceDropdownField;
