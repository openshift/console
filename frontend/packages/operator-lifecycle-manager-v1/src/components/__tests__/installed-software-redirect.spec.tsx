import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import InstalledSoftwareRedirect from '../installed-software-redirect';

// Mirrors the console.page/route registration, which is not exact and so appends a splat to
// every path. Without the namespaced paths the ns param never resolves.
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/installed-software/all-namespaces/*"
          element={<InstalledSoftwareRedirect />}
        />
        <Route path="/installed-software/ns/:ns/*" element={<InstalledSoftwareRedirect />} />
        <Route path="/installed-software/*" element={<InstalledSoftwareRedirect />} />
        <Route path="/installed-operators/all-namespaces" element={<div>Next-Gen all</div>} />
        <Route path="/installed-operators/ns/:ns" element={<div>Next-Gen ns</div>} />
        <Route
          path="/installed-operators/all-namespaces/classic"
          element={<div>Classic all</div>}
        />
        <Route path="/installed-operators/ns/:ns/classic" element={<div>Classic ns</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('InstalledSoftwareRedirect', () => {
  it('should redirect /installed-software to /installed-operators/all-namespaces', () => {
    renderAt('/installed-software');

    expect(screen.getByText('Next-Gen all')).toBeInTheDocument();
  });

  it('should redirect /installed-software/all-namespaces to /installed-operators/all-namespaces', () => {
    renderAt('/installed-software/all-namespaces');

    expect(screen.getByText('Next-Gen all')).toBeInTheDocument();
  });

  it('should redirect /installed-software/ns/foo to /installed-operators/ns/foo', () => {
    renderAt('/installed-software/ns/foo');

    expect(screen.getByText('Next-Gen ns')).toBeInTheDocument();
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
