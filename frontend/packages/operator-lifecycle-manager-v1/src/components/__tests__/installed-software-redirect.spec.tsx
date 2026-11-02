import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { InstalledSoftwareRedirect } from '../installed-software-redirect';

const CurrentLocation = () => {
  const { pathname, search, hash } = useLocation();
  return <output>{`${pathname}${search}${hash}`}</output>;
};

// Mirrors the console.page/route registration, which is not exact and so appends a splat to
// every path. Without the namespaced paths the ns param never resolves.
// Use a dedicated MemoryRouter to control initial entries for redirect tests.
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CurrentLocation />
      <Routes>
        <Route
          path="/installed-software/all-namespaces/*"
          element={<InstalledSoftwareRedirect />}
        />
        <Route path="/installed-software/ns/:ns/*" element={<InstalledSoftwareRedirect />} />
        <Route path="/installed-software/*" element={<InstalledSoftwareRedirect />} />
        <Route path="/installed-operators/all-namespaces" element={<div>OLMv1 all</div>} />
        <Route path="/installed-operators/ns/:ns" element={<div>OLMv1 ns</div>} />
        <Route
          path="/installed-operators/all-namespaces/classic"
          element={<div>Classic all</div>}
        />
        <Route path="/installed-operators/ns/:ns/classic" element={<div>Classic ns</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('InstalledSoftwareRedirect', () => {
  it.each([
    ['all-namespaces/olmv0-operators', 'all-namespaces/classic'],
    ['ns/foo/olmv0-operators', 'ns/foo/classic'],
    ['all-namespaces', 'all-namespaces'],
    ['ns/foo', 'ns/foo'],
  ])('should preserve query parameters and hash when redirecting %s', (source, destination) => {
    const suffix = '?page=1&perPage=1&name=console-migration-#content-scrollable';
    renderAt(`/installed-software/${source}${suffix}`);

    expect(screen.getByRole('status')).toHaveTextContent(
      `/installed-operators/${destination}${suffix}`,
    );
  });

  it('should redirect /installed-software to /installed-operators/all-namespaces', () => {
    renderAt('/installed-software');

    expect(screen.getByText('OLMv1 all')).toBeInTheDocument();
  });

  it('should redirect /installed-software/all-namespaces to /installed-operators/all-namespaces', () => {
    renderAt('/installed-software/all-namespaces');

    expect(screen.getByText('OLMv1 all')).toBeInTheDocument();
  });

  it('should redirect /installed-software/ns/foo to /installed-operators/ns/foo', () => {
    renderAt('/installed-software/ns/foo');

    expect(screen.getByText('OLMv1 ns')).toBeInTheDocument();
  });

  it('should redirect /installed-software/ns/foo/olmv0-operators to /installed-operators/ns/foo/classic', () => {
    renderAt('/installed-software/ns/foo/olmv0-operators');

    expect(screen.getByText('Classic ns')).toBeInTheDocument();
  });

  it('should redirect /installed-software/all-namespaces/olmv0-operators to /installed-operators/all-namespaces/classic', () => {
    renderAt('/installed-software/all-namespaces/olmv0-operators');

    expect(screen.getByText('Classic all')).toBeInTheDocument();
  });
});
