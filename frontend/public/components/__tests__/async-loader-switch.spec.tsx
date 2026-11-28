import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AsyncComponent, type LazyLoader } from '../utils/async';

const JobPage = () => <div data-test="job-page">job</div>;
const CronJobPage = () => <div data-test="cronjob-page">cronjob</div>;
const FallbackPage = () => <div data-test="fallback-page">fallback</div>;

const jobLoader: LazyLoader<typeof JobPage> = () => Promise.resolve(JobPage);
const cronJobLoader: LazyLoader<typeof CronJobPage> = () => Promise.resolve(CronJobPage);

// Mirrors the fallback wrapper from resource-list.tsx.
const withFallback = <C extends typeof JobPage>(
  loader: LazyLoader<C>,
  fallback: C,
): LazyLoader<C> => {
  const wrapper = async () => {
    try {
      return await loader();
    } catch {
      return fallback;
    }
  };
  Object.defineProperty(wrapper, '__wrappedLoader', { value: loader });
  return wrapper;
};

describe('AsyncComponent loader switching', () => {
  it('switches components when a fallback-wrapped loader changes', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <AsyncComponent loader={withFallback(jobLoader, FallbackPage as any) as any} />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('job-page')).toBeInTheDocument();

    // Both wrappers share their source code; only identity distinguishes them.
    rerender(
      <MemoryRouter>
        <AsyncComponent loader={withFallback(cronJobLoader, FallbackPage as any) as any} />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('cronjob-page')).toBeInTheDocument();
  });

  it('does not remount when passed the same fallback-wrapped loader', async () => {
    const loader = withFallback(jobLoader, FallbackPage as any);
    const { rerender } = render(
      <MemoryRouter>
        <AsyncComponent loader={loader as any} />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('job-page')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <AsyncComponent loader={loader as any} />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('job-page')).toBeInTheDocument();
  });

  it('falls back when the wrapped loader rejects', async () => {
    const failingLoader: LazyLoader<any> = () => Promise.reject(new Error('chunk failed'));
    render(
      <MemoryRouter>
        <AsyncComponent loader={withFallback(failingLoader, FallbackPage as any) as any} />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('fallback-page')).toBeInTheDocument();
  });
});
