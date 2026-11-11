import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DroppableFileInput } from '../file-input';

const renderInput = (onChange: jest.Mock) =>
  render(
    <DroppableFileInput
      inputFileData=""
      onChange={onChange}
      label="Upload file"
      id="file-upload-test"
      filenamePlaceholder="Drag and drop a file or upload one"
    />,
  );

const uploadFile = async (container: HTMLElement, bytes: Uint8Array, name: string) => {
  // PatternFly renders the file input hidden and without an accessible name
  // eslint-disable-next-line testing-library/no-node-access
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  const user = userEvent.setup();
  await user.upload(input, new File([bytes.buffer as ArrayBuffer], name));
};

describe('DroppableFileInput', () => {
  it('preserves a leading UTF-8 BOM in uploaded text files', async () => {
    const onChange = jest.fn();
    const { container } = renderInput(onChange);

    await uploadFile(
      container,
      new Uint8Array([0xef, 0xbb, 0xbf, 0x70, 0x61, 0x73, 0x73]),
      'file.txt',
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    // The BOM must be retained, matching Buffer.toString('utf-8')
    onChange.mock.calls.forEach(([value, isBinary]) => {
      expect(value).toBe('\uFEFFpass');
      expect(isBinary).toBe(false);
    });
  });

  it('encodes uploaded binary files as base64', async () => {
    const onChange = jest.fn();
    const { container } = renderInput(onChange);

    await uploadFile(container, new Uint8Array([0x00, 0x01, 0x02, 0x03]), 'file.bin');

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [value, isBinary] = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(isBinary).toBe(true);
    expect(Buffer.from(value, 'base64')).toEqual(Buffer.from([0x00, 0x01, 0x02, 0x03]));
  });

  it('preserves bytes as base64 when invalid UTF-8 is in the unsampled middle', async () => {
    const onChange = jest.fn();
    const { container } = renderInput(onChange);

    const bytes = new Uint8Array(192 * 1024).fill(0x61);
    bytes[98292] = 0xe9; // invalid UTF-8 beyond the classifier's head and tail scans
    await uploadFile(container, bytes, 'file.txt');

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [value, isBinary] = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(isBinary).toBe(true);
    expect(Buffer.from(value, 'base64')).toEqual(Buffer.from(bytes));
  });
});
