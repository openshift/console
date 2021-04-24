import { ArrayHelpers } from 'formik';
import { FieldProps } from '../field-types';

export type TextColumnFieldProps = FieldProps & {
  required?: boolean;
  name: string;
  label: string;
  addLabel?: string;
  tooltip?: string;
  placeholder?: string;
  onChange?: (newValue: string[]) => void;
  dndEnabled?: boolean;
};

export type TextColumnItemProps = TextColumnFieldProps & {
  idx: number;
  rowValues: string[];
  arrayHelpers: ArrayHelpers;
};

export const ItemTypes = {
  TextColumn: 'TextColumn',
};

export type DragItem = {
  idx: number;
  id: string;
  type: string;
};
