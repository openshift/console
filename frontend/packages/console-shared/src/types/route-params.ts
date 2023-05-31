export type ConsoleRouteParams = Partial<
  Record<
    | 'appName'
    | 'catalogNamespace'
    | 'csvName'
    | 'currentCSV'
    | 'name'
    | 'ns'
    | 'pkg'
    | 'plural'
    | 'targetNamespace',
    string
  >
>;
