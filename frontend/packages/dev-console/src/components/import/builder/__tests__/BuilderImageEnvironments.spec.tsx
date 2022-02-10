import * as React from 'react';
import { shallow } from 'enzyme';
import { useFormikContext } from 'formik';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { InputField } from '@console/shared';
import BuilderImageEnvironments from '../BuilderImageEnvironments';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    values: {
      build: { env: [{ name: 'TEST_KEY', value: 'TEST_VAL' }] },
      image: {},
    },
  })),
  useField: jest.fn(() => ['', { touched: false }]),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('react', () => {
  const react = jest.requireActual('react');
  return {
    ...react,
    useEffect: jest.fn(),
  };
});

// make jest synchronously run the useEffect inside shallow
jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

const mockExtensionsHook = useResolvedExtensions as jest.Mock;
const mockFormikContext = useFormikContext as jest.Mock;

describe('BuilderImageEnvironments', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should not render anything when there are no extensions provided', () => {
    mockExtensionsHook.mockReturnValue([[], true]);
    const wrapper = shallow(
      <BuilderImageEnvironments
        name="image.imageEnv"
        imageStreamName="nodejs-ex"
        imageStreamTag="14-ubi8"
      />,
    );
    expect(wrapper.children()).toHaveLength(0);
  });

  it('should not render anything when imagestream does not exist in intensions', () => {
    mockExtensionsHook.mockReturnValue([
      [{ properties: { imageStreamName: 'golang', imageStreamTags: ['latest'] } }],
      true,
    ]);
    const wrapper = shallow(
      <BuilderImageEnvironments
        name="image.imageEnv"
        imageStreamName="nodejs-ex"
        imageStreamTag="latest"
      />,
    );
    expect(wrapper.children()).toHaveLength(0);
  });

  it('should render field when matching imagestream is provided', () => {
    mockExtensionsHook.mockReturnValue([
      [
        {
          properties: {
            imageStreamName: 'nodejs-ex',
            imageStreamTags: ['latest'],
            environments: [{ key: 'NPM_RUN' }],
          },
        },
      ],
      true,
    ]);
    const wrapper = shallow(
      <BuilderImageEnvironments
        name="image.imageEnv"
        imageStreamName="nodejs-ex"
        imageStreamTag="latest"
      />,
    );
    expect(wrapper.find(InputField)).toHaveLength(1);
    expect(wrapper.find(InputField).props().name).toEqual('image.imageEnv.NPM_RUN');
  });

  it('should initialize field when a matching builderImage value exists in edit flow', () => {
    mockExtensionsHook.mockReturnValue([
      [
        {
          properties: {
            imageStreamName: 'nodejs-ex',
            imageStreamTags: ['latest'],
            environments: [{ key: 'TEST_KEY' }],
          },
        },
      ],
      true,
    ]);
    const setFieldValueMock = jest.fn();
    mockFormikContext.mockReturnValue({
      setFieldValue: setFieldValueMock,
      values: {
        build: { env: [{ name: 'TEST_KEY', value: 'TEST_VAL' }] },
        image: {},
        formType: 'edit',
      },
    });
    shallow(
      <BuilderImageEnvironments
        name="image.imageEnv"
        imageStreamName="nodejs-ex"
        imageStreamTag="latest"
      />,
    );
    expect(setFieldValueMock).toHaveBeenCalledTimes(1);
    expect(setFieldValueMock).toHaveBeenCalledWith('image.imageEnv.TEST_KEY', 'TEST_VAL');
  });
});
