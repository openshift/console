import * as React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import AdvancedSection from '../AdvancedSection';

window.HTMLElement.prototype.scrollIntoView = () => {}; // scrollIntoView is not implemented in jsdom

const handleSubmit = jest.fn();

beforeEach(() =>
  render(
    <MockForm handleSubmit={handleSubmit}>
      {() => <AdvancedSection resourceType={Resources.OpenShift} />}
    </MockForm>,
  ),
);

afterEach(() => cleanup());

test('AdvancedSection: should show Pause rollouts section on click', async () => {
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
});

test('AdvancedSection: should show Scaling section on click', async () => {
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
});
