import { ReactElement, ReactNode } from 'react';
import { Form } from '@patternfly/react-core';
import {
  render,
  RenderOptions,
  screen,
  fireEvent,
  waitFor,
  within,
  BoundFunctions,
  Queries,
} from '@testing-library/react';
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

interface FormikWrapperProps {
  children?: ReactNode;
}

export const mockFormikRenderer = (
  element: ReactElement,
  initialValues?: FormikValues,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const FormikWrapper: React.FC<FormikWrapperProps> = ({ children }) => (
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
  // TODO: Use the 'userEvent' instead of 'fireEvent' after Jest and React Testing Libraries upgrade
  if (testValue !== undefined) {
    await (async () => {
      fireEvent.change(input, { target: { value: testValue } });
      await waitFor(() => expect(input).toHaveValue(testValue));
    });
  }
};
