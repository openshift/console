import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import InstalledOperatorsRedirect from '../installed-operators-redirect';

describe('InstalledOperatorsRedirect', () => {
  it('should redirect /k8s/ns/foo/operators.coreos.com~v1alpha1~ClusterServiceVersion to /installed-operators/ns/foo/classic', () => {
    render(
      <MemoryRouter
        initialEntries={['/k8s/ns/foo/operators.coreos.com~v1alpha1~ClusterServiceVersion']}
      >
        <Routes>
          <Route
            path="/k8s/ns/:ns/operators.coreos.com~v1alpha1~ClusterServiceVersion"
            element={<InstalledOperatorsRedirect />}
          />
          <Route path="/installed-operators/ns/:ns/classic" element={<div>Classic ns</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Classic ns')).toBeInTheDocument();
  });

  it('should redirect /k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion to /installed-operators/all-namespaces/classic', () => {
    render(
      <MemoryRouter
        initialEntries={['/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion']}
      >
        <Routes>
          <Route
            path="/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion"
            element={<InstalledOperatorsRedirect />}
          />
          <Route
            path="/installed-operators/all-namespaces/classic"
            element={<div>Classic all</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Classic all')).toBeInTheDocument();
  });
});
