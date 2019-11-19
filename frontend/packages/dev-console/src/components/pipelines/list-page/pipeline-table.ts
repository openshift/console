import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  'col-lg-2 col-md-3 col-sm-4 col-xs-4', // name
  'col-lg-2 col-md-3 col-sm-3 col-xs-3', // namespace
  'col-lg-2 col-md-4 col-sm-5 col-xs-5', // last run
  'col-lg-2 col-md-2 hidden-sm hidden-xs', // task status
  'col-lg-2 hidden-md hidden-sm hidden-xs', // last run status
  'col-lg-2 hidden-md hidden-sm hidden-xs', // last run time
  Kebab.columnClass,
];
