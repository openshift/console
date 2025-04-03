import 'jest';

declare global {
  namespace jest {
    /**
     * Returns the actual module instead of a mock, bypassing all checks on
     * whether the module should receive a mock implementation or not.
     *
     * TODO: Remove when jest is updated
     */
    function requireActual(moduleName: string): any;
  }
}
