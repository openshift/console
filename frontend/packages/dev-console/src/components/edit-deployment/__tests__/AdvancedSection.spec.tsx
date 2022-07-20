import * as React from 'react';
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react';
import i18n from 'i18next';
import { setI18n } from 'react-i18next';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import AdvancedSection from '../AdvancedSection';

configure({ testIdAttribute: 'data-test' });

window.HTMLElement.prototype.scrollIntoView = () => {}; // scrollIntoView is not implemented in jsdom

const handleSubmit = jest.fn();

beforeEach(() => {
  i18n.services.interpolator = {
    init: () => undefined,
    reset: () => undefined,
    resetRegExp: () => undefined,
    interpolate: (str: string) => str,
    nest: (str: string) => str,
  };
  setI18n(i18n);

  render(
    <MockForm handleSubmit={handleSubmit}>
      {() => <AdvancedSection resourceType={Resources.OpenShift} />}
    </MockForm>,
  );
});

afterEach(() => cleanup());

describe('AdvancedSection', () => {
  it('should show Pause rollouts section on click', async () => {
    expect(screen.getByTestId('edit-deployment-testid').textContent).toEqual(
      'Click on the names to access advanced options for Pause rollouts and Scaling.',
    );

    const pauseRolloutsButton = screen.getByRole('button', {
      name: /pause rollouts/i,
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('pause-rollouts')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();

    fireEvent.click(pauseRolloutsButton);

    await waitFor(() => {
      expect(screen.queryByTestId('pause-rollouts')).not.toBeNull();
      expect(screen.queryByRole('checkbox')).not.toBeNull();
    });

    expect(screen.getByTestId('edit-deployment-testid').textContent).toContain(
      'Click on the names to access advanced options for Scaling.',
    );
  });

  it('should show Scaling section on click', async () => {
    expect(screen.getByTestId('edit-deployment-testid').textContent).toEqual(
      'Click on the names to access advanced options for Pause rollouts and Scaling.',
    );

    const scalingButton = screen.getByRole('button', {
      name: 'Scaling',
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('scaling')).toBeNull();
    expect(screen.queryByRole('spinbutton', { name: /input/i })).toBeNull();

    fireEvent.click(scalingButton);

    await waitFor(() => {
      expect(screen.queryByTestId('scaling')).not.toBeNull();
      expect(screen.queryByRole('spinbutton', { name: /input/i })).not.toBeNull();
    });

    expect(screen.getByTestId('edit-deployment-testid').textContent).toContain(
      'Click on the names to access advanced options for Pause rollouts.',
    );
  });

  it('should not show message when both advanced options are clicked', async () => {
    expect(screen.getByTestId('edit-deployment-testid').textContent).toEqual(
      'Click on the names to access advanced options for Pause rollouts and Scaling.',
    );
    const pauseRolloutsButton = screen.getByRole('button', {
      name: /pause rollouts/i,
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('pause-rollouts')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();

    fireEvent.click(pauseRolloutsButton);

    await waitFor(() => {
      expect(screen.queryByTestId('pause-rollouts')).not.toBeNull();
      expect(screen.queryByRole('checkbox')).not.toBeNull();
    });

    expect(screen.getByTestId('edit-deployment-testid').textContent).toContain(
      'Click on the names to access advanced options for Scaling.',
    );

    const scalingButton = screen.getByRole('button', {
      name: 'Scaling',
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('scaling')).toBeNull();
    expect(screen.queryByRole('spinbutton', { name: /input/i })).toBeNull();

    fireEvent.click(scalingButton);

    await waitFor(() => {
      expect(screen.queryByTestId('scaling')).not.toBeNull();
      expect(screen.queryByRole('spinbutton', { name: /input/i })).not.toBeNull();
    });

    expect(screen.getByTestId('edit-deployment-testid').textContent).not.toContain(
      'Click on the names to access advanced options for ',
    );
  });
});
