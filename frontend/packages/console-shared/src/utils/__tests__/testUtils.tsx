import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import store from '@console/internal/redux'; // Adjust the path to your Redux store

// TODO: Enhance this function as the need arises
export const renderWithProviders = (ui: ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>,
  );
};
