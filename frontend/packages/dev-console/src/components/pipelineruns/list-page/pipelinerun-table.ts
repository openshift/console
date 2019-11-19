import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  'col-lg-3 col-md-4 col-sm-4 col-xs-4', // name
  'col-lg-2 col-md-3 col-sm-3 col-xs-3', // namespace
  'col-lg-2 col-md-2 col-sm-2 col-xs-2', // task status
  'col-lg-2 col-md-3 col-sm-3 col-xs-3', // started
  'col-lg-1 hidden-md hidden-sm hidden-xs', // duration
  'col-lg-2 hidden-md hidden-sm hidden-xs', // status
  Kebab.columnClass,
];
