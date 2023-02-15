import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type DataSource = ExtensionDeclaration<
  'console.dashboards/datasource',
  {
    contextId: string;
    /** Returns a extension function that provides a custom data source object */
    getDataSource: CodeRef<(dataSourceID: string) => Promise<CustomDataSource>>;
  }
>;

export const isDataSource = (e: Extension): e is DataSource => {
  return e.type === 'console.dashboards/datasource';
};

export type CustomDataSource = {
  basePath: string;
  dataSourceType: string;
};
