import dynamicModuleImportLoader, {
  DynamicModuleImportLoader,
  DynamicModuleImportLoaderOptions,
} from '../dynamic-module-import-loader';

type LoaderThisType = ThisParameterType<DynamicModuleImportLoader>;

const createGetOptionsMock = (options: DynamicModuleImportLoaderOptions) =>
  jest.fn<typeof options>(() => options);

const callLoaderFunction = (
  thisArg: Partial<LoaderThisType>,
  ...args: Parameters<DynamicModuleImportLoader>
) => dynamicModuleImportLoader.call(thisArg, ...args) as ReturnType<DynamicModuleImportLoader>;

describe('dynamicModuleImportLoader', () => {
  it('returns the same source if there is nothing to transform', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {},
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(source);

    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('returns the same source if there are no references to dynamic modules', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';

export const TestComponent: React.FC = () => {
  return null;
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
              },
            },
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(source);

    expect(loggerWarn).not.toHaveBeenCalled();

    const invalidSource = `
.demo-modal__page { height: 80%; }
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.css',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
              },
            },
            resourceMetadata: { jsx: false },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        invalidSource,
      ),
    ).toBe(invalidSource);

    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('returns the same source if there are any parse errors', () => {
    const loggerWarn = jest.fn<void>();

    const invalidSource = `
/* Test reference to @patternfly/react-icons */
.demo-modal__page { height: 80%; }
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.css',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
              },
            },
            resourceMetadata: { jsx: false },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        invalidSource,
      ),
    ).toBe(invalidSource);

    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn.mock.calls[0]).toEqual(['Detected parse errors in /test/resource.css']);
  });

  it('transforms index imports where the relevant dynamic module is known', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
                StopIcon: 'dist/dynamic/icons/stop-icon',
              },
            },
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(`
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/dynamic/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('does not transform index imports where the relevant dynamic module is unknown', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
              },
            },
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(`
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn.mock.calls[0]).toEqual([
      'No dynamic module found for StopIcon in @patternfly/react-icons',
    ]);
  });

  it('does not transform non-index imports', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/esm/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
              },
            },
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(`
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/esm/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn.mock.calls[0]).toEqual([
      'Non-index and non-dynamic module import @patternfly/react-icons/dist/esm/icons/stop-icon',
    ]);
  });

  it('preserves named aliases of transformed imports', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';
import { PlayIcon as PF_Icon_Play, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
                StopIcon: 'dist/dynamic/icons/stop-icon',
              },
            },
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(`
import * as React from 'react';
import { PlayIcon as PF_Icon_Play } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/dynamic/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('preserves leading comments of transformed imports', () => {
    const loggerWarn = jest.fn<void>();

    const source = `
import * as React from 'react';
/** Foo bar test */
// Example comment
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction(
        {
          resourcePath: '/test/resource.tsx',
          getOptions: createGetOptionsMock({
            dynamicModuleMaps: {
              '@patternfly/react-icons': {
                PlayIcon: 'dist/dynamic/icons/play-icon',
                StopIcon: 'dist/dynamic/icons/stop-icon',
              },
            },
            resourceMetadata: { jsx: true },
          }),
          getLogger: () => ({ warn: loggerWarn } as any),
        },
        source,
      ),
    ).toBe(`
import * as React from 'react';
/** Foo bar test */
// Example comment
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/dynamic/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerWarn).not.toHaveBeenCalled();
  });
});
