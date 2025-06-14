import { ReactElement } from 'react';
import { Form } from '@patternfly/react-core';
import { render, RenderOptions } from '@testing-library/react';
import { Formik, FormikValues } from 'formik';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux';

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

/**
 * Renders a React element with our Redux store and a BrowserRouter.
 */
export const renderWithProviders = (
  element: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(element, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    ),
    ...options,
  });
