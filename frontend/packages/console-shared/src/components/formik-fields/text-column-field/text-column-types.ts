import { ArrayHelpers } from 'formik';
import { FieldProps } from '../field-types';

export type OnChangeHandler = (newValue: string[]) => void;
export type TextColumnFieldChildParameterProps = {
  name: string;
  onChange?: OnChangeHandler;
  isReadOnly?: boolean;
  placeholder?: string;
};

export type MergeNewValueUtil = (newValue: string) => string[];
export type TextColumnFieldChildProps = (
  data: TextColumnFieldChildParameterProps,
  mergeNewValue: MergeNewValueUtil,
) => React.ReactNode;

export type TextColumnFieldProps = FieldProps & {
  required?: boolean;
  name: string;
  label: string;
  addLabel?: string;
  disableDeleteRow?: boolean;
  tooltipDeleteRow?: string;
  placeholder?: string;
  onChange?: OnChangeHandler;
  dndEnabled?: boolean;
  children?: TextColumnFieldChildProps;
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
