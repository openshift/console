import * as React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import { combineReducers, createStore } from 'redux';
import { RootState, baseReducers } from '@console/internal/redux';

const rootReducer = combineReducers<RootState>(baseReducers);
const setupStore = (initialState?: Partial<RootState>) => {
  return createStore(rootReducer, initialState);
};

export type AppStore = ReturnType<typeof setupStore>;
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialState?: Partial<RootState>;
  store?: AppStore;
}

type WrapperProps = {
  children: React.ReactNode;
};

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
