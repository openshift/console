import { ReactElement } from 'react';
import { Form } from '@patternfly/react-core';
import { render, RenderOptions } from '@testing-library/react';
import { Formik, FormikValues } from 'formik';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import { combineReducers, createStore } from 'redux';
import { RootState, baseReducers } from '@console/internal/redux';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialState?: Partial<RootState>;
  store?: ReturnType<typeof setupStore>;
}

type WrapperProps = {
  children: React.ReactNode;
};

// Create a Redux store with reducer and initial state.
const rootReducer = combineReducers<RootState>(baseReducers);
const setupStore = (initialState?: Partial<RootState>) => {
  return createStore(rootReducer, initialState);
};

/**
 * Custom render function wrapper for Redux Provider and React Router
 * @param ui - React element to render
 * @param options - Extended render options including initialState and store
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialState = {},
    // Create a store instance if no custom store was passed in
    store = setupStore(initialState),
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: WrapperProps): JSX.Element {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export const mockFormikRenderer = (
  element: ReactElement,
  initialValues?: FormikValues,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(element, {
    wrapper: ({ children }) => (
      <Formik initialValues={initialValues} onSubmit={() => {}}>
        {({ handleSubmit }) => <Form onSubmit={handleSubmit}>{children}</Form>}
      </Formik>
    ),
    ...options,
  });
