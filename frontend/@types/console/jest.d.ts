import 'jest';

declare global {
  namespace jest {
    /**
     * Returns the actual module instead of a mock, bypassing all checks on
     * whether the module should receive a mock implementation or not.
     *
     * TODO: Update `@types/jest` and reconcile the type errors, then remove this file.
     */
    function requireActual(moduleName: string): any;
  }
}
