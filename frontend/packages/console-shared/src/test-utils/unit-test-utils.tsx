import type { FC, ReactElement, ReactNode } from 'react';
import type { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { Form } from '@patternfly/react-core';
import type {
  RenderOptions,
  RenderHookOptions,
  BoundFunctions,
  Queries,
} from '@testing-library/react';
import { render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikValues } from 'formik';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { combineReducers, createStore } from 'redux';
import type { UserSettingsStore } from '@console/app/src/providers/user-preferences/UserPreferenceContext';
import {
  createUserSettingsStore,
  UserPreferenceContext,
} from '@console/app/src/providers/user-preferences/UserPreferenceContext';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';
import { pluginStore as defaultPluginStore } from '@console/internal/plugins';
import type { RootState } from '@console/internal/redux';
import { baseReducers } from '@console/internal/redux';

export interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries' | 'wrapper'> {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof setupStore>;
  pluginStore?: PluginStore;
  userSettingsStore?: UserSettingsStore;
}

export interface ExtendedRenderHookOptions<TProps> extends Omit<
  RenderHookOptions<TProps>,
  'wrapper'
> {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof setupStore>;
  pluginStore?: PluginStore;
  userSettingsStore?: UserSettingsStore;
}

type WrapperProps = {
  children: React.ReactNode;
};

// Create a Redux store with reducer and initial state.
const rootReducer = combineReducers(baseReducers);
const setupStore = (initialState?: Partial<RootState>) => {
  const store = createStore(rootReducer, initialState);
  // Set the store in storeHandler so that modules like rbac.tsx can access it
  storeHandler.setStore(store);
  return store;
};

/**
 * Build a self-contained user-settings store for tests.
 *
 * Unlike the real {@link UserPreferenceProvider} it does not watch a ConfigMap (no
 * `useK8sWatchResource` call) or touch browser storage, so it never perturbs
 * unrelated assertions (e.g. watch call counts). It starts unloaded, matching a
 * tree with no backend wired up; writes are kept in memory. Tests that need
 * loaded values or the real backend should pass their own `userSettingsStore`
 * (e.g. `createUserSettingsStore()` pre-seeded via `setSnapshot`) or mount
 * {@link UserPreferenceProvider} themselves.
 */
const createMockUserSettingsStore = () => {
  const store = createUserSettingsStore();
  store.setUpdateKey(async (sanitizedKey, serializedValue) => {
    const snapshot = store.getSnapshot();
    store.setSnapshot({
      ...snapshot,
      data: { ...snapshot.data, [sanitizedKey]: serializedValue },
    });
  });
  return store;
};

/**
 * Create a Wrapper component containing mock providers for redux store,
 * PluginStore, user settings, and react-router
 *
 * @param reduxStore - Redux store instance
 * @param pluginStore - Plugin store instance
 * @param userSettingsStore - User settings store instance
 * @returns
 */
const createWrapper =
  (
    reduxStore: ReturnType<typeof setupStore>,
    pluginStore: PluginStore,
    userSettingsStore: UserSettingsStore,
  ): FC<WrapperProps> =>
  ({ children }) => (
    <Provider store={reduxStore}>
      <PluginStoreProvider store={pluginStore}>
        <UserPreferenceContext.Provider value={userSettingsStore}>
          <MemoryRouter>{children}</MemoryRouter>
        </UserPreferenceContext.Provider>
      </PluginStoreProvider>
    </Provider>
  );

/**
 * Custom render function wrapper for Redux Provider and React Router
 *
 * @param ui - React element to render
 * @param options - Extended render options including initialState and store
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialState = {},
    // Create a store instance if no custom store was passed in
    store = setupStore(initialState),
    pluginStore = defaultPluginStore,
    userSettingsStore = createMockUserSettingsStore(),
    ...renderOptions
  }: ExtendedRenderOptions = {},
) => ({
  store,
  pluginStore,
  userSettingsStore,
  ...render(ui, {
    wrapper: createWrapper(store, pluginStore, userSettingsStore),
    ...renderOptions,
  }),
});

/**
 * Custom renderHook function wrapper for Redux Provider and React Router
 *
 * @param callback - Hook function to render
 * @param options - Extended render options including initialState and store
 */
export const renderHookWithProviders = <TResult, TProps>(
  hook: (initialProps: TProps) => TResult,
  {
    initialState = {},
    // Create a store instance if no custom store was passed in
    store = setupStore(initialState),
    pluginStore = defaultPluginStore,
    userSettingsStore = createMockUserSettingsStore(),
    ...renderOptions
  }: ExtendedRenderHookOptions<TProps> = {},
) => ({
  store,
  pluginStore,
  userSettingsStore,
  ...renderHook<TResult, TProps>(hook, {
    wrapper: createWrapper(store, pluginStore, userSettingsStore),
    ...renderOptions,
  }),
});

interface FormikWrapperProps {
  children?: ReactNode;
}

export const mockFormikRenderer = (
  element: ReactElement,
  initialValues?: FormikValues,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const FormikWrapper: FC<FormikWrapperProps> = ({ children }) => (
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {({ handleSubmit }) => <Form onSubmit={handleSubmit}>{children}</Form>}
    </Formik>
  );

  return render(element, {
    wrapper: FormikWrapper,
    ...options,
  });
};

// Helper function for verifying form input element visibility, type attribute, initial value and required status
export const verifyFormElementBasics = (
  element: HTMLElement,
  expectedType?: string,
  initialValue?: string,
  isRequired?: boolean,
) => {
  expect(element).toBeVisible();
  if (expectedType) {
    expect(element).toHaveAttribute('type', expectedType);
  }
  if (initialValue) {
    expect(element).toHaveValue(initialValue);
  }
  isRequired ? expect(element).toBeRequired() : expect(element).not.toBeRequired();
};

/**
 * A reusable function to verify an input element with optional container scoping.
 * @param inputLabel - The label text associated with the input element.
 * @param inputType - The type of the input element (default is 'text').
 * @param containerId - The ID of the container to scope the search (optional).
 * @param initialValue - The initial value of the input element (optional).
 * @param testValue - The value to enter for testing input functionality (optional).
 * @param helpText - The expected help text associated with the input element (optional).
 * @param isRequired - Whether the input element is required (default is false).
 */
export const verifyInputField = async ({
  inputLabel,
  inputType = 'text',
  containerId,
  initialValue = '',
  testValue,
  helpText = '',
  isRequired = false,
}: {
  inputLabel: string;
  inputType?: string;
  containerId?: string;
  initialValue?: string;
  testValue?: string;
  helpText?: string;
  isRequired?: boolean;
}) => {
  // A query variable that scope the queries to that container, which defaults to the global 'screen' object if a container ID is provided.
  let container: BoundFunctions<Queries> | typeof screen = screen;

  if (containerId) {
    const containerElement = screen.getByTestId(containerId);
    expect(containerElement).toBeInTheDocument();
    container = within(containerElement);
  }

  // Query the input element by its associated label text
  const input = container.getByLabelText(inputLabel) as HTMLInputElement;

  verifyFormElementBasics(input, inputType, initialValue, isRequired);

  // Verify the help text is visible
  if (helpText) {
    expect(container.getByText(helpText)).toBeVisible();
  }

  // Simulate an input change if a new value is provided
  if (testValue !== undefined) {
    const user = userEvent.setup();
    await user.clear(input);
    await user.type(input, testValue);
    await waitFor(() => expect(input).toHaveValue(testValue));
  }
};
