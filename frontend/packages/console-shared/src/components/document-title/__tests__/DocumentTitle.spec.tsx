import { render } from '@testing-library/react';
import { DocumentTitle } from '../DocumentTitle';

// window.SERVER_FLAGS.branding is unset in tests, so branding falls back to OKD
const productName = 'OKD';

const documentTitle = (): HTMLTitleElement => {
  // eslint-disable-next-line testing-library/no-node-access -- React 19 hoists <title> to <head>, outside the reach of Testing Library queries
  const title = document.head.querySelector('title');
  expect(title).not.toBeNull();
  return title as HTMLTitleElement;
};

describe('DocumentTitle', () => {
  it('renders the page title with the product name suffix', () => {
    render(<DocumentTitle>Project details</DocumentTitle>);
    expect(documentTitle()).toHaveTextContent(`Project details · ${productName}`);
  });

  it('applies the telemetry attribute when the internal prop is supplied', () => {
    render(
      <DocumentTitle __internal_data_telemetry="Project · Details">
        Project · Details
      </DocumentTitle>,
    );
    const title = documentTitle();
    expect(title).toHaveAttribute('data-telemetry', 'Project · Details');
    expect(title).toHaveTextContent(`Project · Details · ${productName}`);
  });

  it('omits the telemetry attribute when not supplied', () => {
    const { unmount } = render(
      <DocumentTitle __internal_data_telemetry="Project · Details">
        Project · Details
      </DocumentTitle>,
    );
    expect(documentTitle()).toHaveAttribute('data-telemetry', 'Project · Details');

    unmount();
    render(<DocumentTitle>Project details</DocumentTitle>);
    const title = documentTitle();
    expect(title).not.toHaveAttribute('data-telemetry');
    expect(title).toHaveTextContent(`Project details · ${productName}`);
  });
});
