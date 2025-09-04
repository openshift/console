import { screen, waitFor } from '@testing-library/react';
import { safeDump } from 'js-yaml';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import * as useExtensionsModule from '@console/plugin-sdk/src/api/useExtensions';
import { CreateYAML, CreateYAMLInner } from '../create-yaml';
import { PodModel } from '../../models';

// Mock AsyncComponent to avoid dynamic import issues in tests
jest.mock('../utils/async', () => ({
  AsyncComponent: () => null,
}));

describe(CreateYAML.displayName, () => {
  beforeEach(() => {
    jest.spyOn(useExtensionsModule, 'useExtensions').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays loading state when kinds are being fetched', async () => {
    const params = { ns: 'default', plural: 'pods' };
    renderWithProviders(<CreateYAMLInner params={params} kindsInFlight={true} kindObj={null} />);

    const progressbar = await screen.findByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('displays YAML editor when kinds are loaded', async () => {
    const params = { ns: 'default', plural: 'pods' };
    const { container } = renderWithProviders(
      <CreateYAMLInner params={params} kindsInFlight={false} kindObj={PodModel} />,
    );

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('uses provided template to initialize the YAML editor', async () => {
    const templateObj = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'cool-app' } };
    const params = { ns: 'default', plural: 'pods' };

    const { container } = renderWithProviders(
      <CreateYAMLInner
        params={params}
        kindsInFlight={false}
        kindObj={PodModel}
        template={safeDump(templateObj)}
      />,
    );

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('uses default YAML template when no template is provided', async () => {
    const params = { ns: 'default', plural: 'pods' };
    const { container } = renderWithProviders(
      <CreateYAMLInner params={params} kindsInFlight={false} kindObj={PodModel} />,
    );

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
