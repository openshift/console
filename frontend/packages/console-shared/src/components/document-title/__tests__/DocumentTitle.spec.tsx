import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Helmet } from 'react-helmet-async';
import { DocumentTitle } from '../DocumentTitle';

jest.mock('react-helmet-async', () => ({
  Helmet: jest.fn(() => null),
}));

const mockedHelmet = Helmet as unknown as jest.Mock;

const titleElements = (): ReactElement[] =>
  mockedHelmet.mock.calls.map(([{ children }]) => children as ReactElement);

afterEach(() => mockedHelmet.mockClear());

describe('DocumentTitle', () => {
  it('applies the telemetry attribute when the internal prop is supplied', () => {
    render(
      <DocumentTitle __internal_data_telemetry="Project · Details">
        Project · Details
      </DocumentTitle>,
    );
    expect(titleElements()[0].props['data-telemetry']).toBe('Project · Details');
  });

  it('omits the telemetry attribute when not supplied so Helmet keeps the navigation label', () => {
    render(
      <>
        <DocumentTitle __internal_data_telemetry="Project · Details">
          Project · Details
        </DocumentTitle>
        <DocumentTitle>Project details</DocumentTitle>
      </>,
    );
    const titles = titleElements();
    expect(titles).toHaveLength(2);
    expect(titles[0].props['data-telemetry']).toBe('Project · Details');
    expect(titles[1].props).not.toHaveProperty('data-telemetry');
  });
});
