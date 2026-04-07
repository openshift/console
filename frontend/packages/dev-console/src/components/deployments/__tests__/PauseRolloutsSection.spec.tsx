import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import PauseRolloutsSection from '../PauseRolloutsSection';

describe('PauseRolloutsSection', () => {
  it('checkbox should work correctly', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(
      <MockForm handleSubmit={handleSubmit}>
        {() => <PauseRolloutsSection name="pause" resourceType={Resources.OpenShift} />}
      </MockForm>,
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.value).toEqual('false');
    await user.click(checkbox);
    await waitFor(() => expect(checkbox.value).toEqual('true'));
  });
});
