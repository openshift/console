import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { CommandLineTools } from '@console/internal/components/command-line-tools';

const obj = {
  data: [
    {
      metadata: {
        name: 'helm-download-links',
        uid: '1',
      },
      spec: {
        displayName: 'helm - Helm 3 CLI',
        links: [],
      },
    },
    {
      metadata: {
        name: 'oc-cli-downloads',
        uid: '2',
      },
      spec: {
        displayName: 'oc - OpenShift Command Line Interface (CLI)',
        links: [],
      },
    },
  ],
  loaded: true,
  loadError: null,
};

const nativeResizeObserver = window.ResizeObserver;
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('CommandLineTools', () => {
  beforeAll(() => {
    window.ResizeObserver = ResizeObserver;
  });

  afterAll(() => {
    window.ResizeObserver = nativeResizeObserver;
    jest.restoreAllMocks();
  });

  describe('When ordering is correct', () => {
    it('shows oc CLI first in the displayed list', async () => {
      renderWithProviders(<CommandLineTools obj={obj} />);

      const ocCliElement = await screen.findByText('oc - OpenShift Command Line Interface (CLI)');
      expect(ocCliElement).toBeVisible();
    });
  });
});
