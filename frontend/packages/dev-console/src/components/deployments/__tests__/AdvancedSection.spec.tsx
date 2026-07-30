import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { setI18n } from 'react-i18next';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import AdvancedSection from '../AdvancedSection';

window.HTMLElement.prototype.scrollIntoView = () => {}; // scrollIntoView is not implemented in jsdom

const handleSubmit = jest.fn();

function setupI18n() {
  if (!i18n.services) {
    (i18n as any).services = {};
  }
  i18n.services.interpolator = {
    init: () => undefined,
    reset: () => undefined,
    resetRegExp: () => undefined,
    interpolate: (str: string) => str,
    nest: (str: string) => str,
  };
  setI18n(i18n);
}

function renderAdvancedSection() {
  render(
    <MockForm handleSubmit={handleSubmit}>
      {() => <AdvancedSection resourceType={Resources.OpenShift} />}
    </MockForm>,
  );
}

beforeEach(() => {
  setupI18n();
});

describe('AdvancedSection', () => {
  it('should show Pause rollouts section on click', async () => {
    renderAdvancedSection();
    const user = userEvent.setup();
    expect(screen.getByTestId('deployment-form-testid').textContent).toEqual(
      'Click on the names to access advanced options for Pause rollouts and Scaling.',
    );

    const pauseRolloutsButton = screen.getByRole('button', {
      name: /pause rollouts/i,
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('pause-rollouts')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.click(pauseRolloutsButton);

    expect(await screen.findByTestId('pause-rollouts')).toBeVisible();
    expect(await screen.findByRole('checkbox')).toBeVisible();

    expect(screen.getByTestId('deployment-form-testid').textContent).toContain(
      'Click on the names to access advanced options for Scaling.',
    );
  });

  it('should show Scaling section on click', async () => {
    renderAdvancedSection();
    const user = userEvent.setup();
    expect(screen.getByTestId('deployment-form-testid').textContent).toEqual(
      'Click on the names to access advanced options for Pause rollouts and Scaling.',
    );

    const scalingButton = screen.getByRole('button', {
      name: 'Scaling',
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('scaling')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: /input/i })).not.toBeInTheDocument();

    await user.click(scalingButton);

    expect(await screen.findByTestId('scaling')).toBeVisible();
    expect(await screen.findByRole('spinbutton', { name: /input/i })).toBeVisible();

    expect(screen.getByTestId('deployment-form-testid').textContent).toContain(
      'Click on the names to access advanced options for Pause rollouts.',
    );
  });

  it('should not show message when both advanced options are clicked', async () => {
    renderAdvancedSection();
    const user = userEvent.setup();
    expect(screen.getByTestId('deployment-form-testid').textContent).toEqual(
      'Click on the names to access advanced options for Pause rollouts and Scaling.',
    );
    const pauseRolloutsButton = screen.getByRole('button', {
      name: /pause rollouts/i,
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('pause-rollouts')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.click(pauseRolloutsButton);

    expect(await screen.findByTestId('pause-rollouts')).toBeVisible();
    expect(await screen.findByRole('checkbox')).toBeVisible();

    expect(screen.getByTestId('deployment-form-testid').textContent).toContain(
      'Click on the names to access advanced options for Scaling.',
    );

    const scalingButton = screen.getByRole('button', {
      name: 'Scaling',
    }) as HTMLButtonElement;

    expect(screen.queryByTestId('scaling')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: /input/i })).not.toBeInTheDocument();

    await user.click(scalingButton);

    expect(await screen.findByTestId('scaling')).toBeVisible();
    expect(await screen.findByRole('spinbutton', { name: /input/i })).toBeVisible();

    expect(screen.getByTestId('deployment-form-testid').textContent).not.toContain(
      'Click on the names to access advanced options for ',
    );
  });
});
