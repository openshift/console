import { getRouteLabelFieldErrors } from '../../public/components/monitoring/receiver-forms/routing-labels-editor';

describe('Routing Label Editor', () => {
  it('validates label names correctly', () => {
    // label names cannot start with digit, and may only contain alphanumeric and '_'
    // these are valid
    let labelErrors = getRouteLabelFieldErrors([{ name: 'aa', value: '', isRegex: false }]);
    expect(labelErrors['0_name']).toBe(undefined);
    labelErrors = getRouteLabelFieldErrors([{ name: '_bb', value: '', isRegex: false }]);
    expect(labelErrors['0_name']).toBe(undefined);
    labelErrors = getRouteLabelFieldErrors([{ name: '_cc98a7_', value: '', isRegex: false }]);
    expect(labelErrors['0_name']).toBe(undefined);
    // these are invalid
    labelErrors = getRouteLabelFieldErrors([{ name: '9abc', value: '', isRegex: false }]);
    expect(labelErrors['0_name']).toBeTruthy();
    labelErrors = getRouteLabelFieldErrors([{ name: 'aa&^%', value: '', isRegex: false }]);
    expect(labelErrors['0_name']).toBeTruthy();
    labelErrors = getRouteLabelFieldErrors([{ name: '_abc_%', value: '', isRegex: false }]);
    expect(labelErrors['0_name']).toBeTruthy();
  });
});
