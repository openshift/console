import { getImageForCSVIcon, CSVIcon } from '../icon-utils';

const mockCSVIconObject: CSVIcon = {
  mediatype: 'image/svg+xml',
  base64data: 'mock-base64-data',
};

const mockCSVIcon = 'data:image/svg+xml;base64,mock-base64-data';

describe('Icon Utils', () => {
  it('should return icon from csv data', () => {
    expect(getImageForCSVIcon(mockCSVIconObject)).toBe(mockCSVIcon);
  });

  it('should return operator icon if csv has no icon data', () => {
    expect(getImageForCSVIcon(undefined)).toBe('icon-operator');
  });
});
