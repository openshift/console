import * as React from 'react';
import { render, fireEvent, screen, waitFor, configure } from '@testing-library/react';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import PauseRolloutsSection from '../PauseRolloutsSection';

configure({ testIdAttribute: 'data-test' });

describe('PauseRolloutsSection', () => {
  it('checkbox should work correctly', async () => {
    const handleSubmit = jest.fn();
    render(
      <MockForm handleSubmit={handleSubmit}>
        {() => <PauseRolloutsSection name="pause" resourceType={Resources.OpenShift} />}
      </MockForm>,
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.value).toEqual('false');
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox.value).toEqual('true'));
  });
});
