import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { render, RenderOptions } from '@testing-library/react';
import { Formik, FormikValues } from 'formik';

export const mockFormikRenderer = (
  element: React.ReactElement,
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
