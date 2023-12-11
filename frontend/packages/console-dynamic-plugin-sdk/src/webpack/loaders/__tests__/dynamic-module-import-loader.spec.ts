import dynamicModuleImportLoader, {
  DynamicModuleImportLoader,
  DynamicModuleImportLoaderOptions,
} from '../dynamic-module-import-loader';

type LoaderThisType = ThisParameterType<DynamicModuleImportLoader>;

const callLoaderFunction = (
  thisArg: Partial<LoaderThisType>,
  ...args: Parameters<DynamicModuleImportLoader>
) => dynamicModuleImportLoader.call(thisArg, ...args) as ReturnType<DynamicModuleImportLoader>;

describe('dynamicModuleImportLoader', () => {
  it('returns the same source if there is nothing to transform', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({ dynamicModuleMaps: {} }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

    const source = `
import * as React from 'react';
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction({ resourcePath: '/test/resource.tsx', getOptions, getLogger }, source),
    ).toBe(source);

    expect(loggerInfo).not.toHaveBeenCalled();
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('returns the same source if there are any parse errors', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({ dynamicModuleMaps: {} }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

    const source = `
.demo-modal__page {
  height: 80%;
}
`;

    expect(
      callLoaderFunction({ resourcePath: '/test/resource.css', getOptions, getLogger }, source),
    ).toBe(source);

    expect(loggerInfo).toHaveBeenCalledTimes(1);
    expect(loggerInfo).toHaveBeenLastCalledWith('Detected parse errors in /test/resource.css');
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('transforms index imports where the relevant dynamic module is known', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({
      dynamicModuleMaps: {
        '@patternfly/react-icons': {
          PlayIcon: 'dist/dynamic/icons/play-icon',
          StopIcon: 'dist/dynamic/icons/stop-icon',
        },
      },
    }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

    const source = `
import * as React from 'react';
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction({ resourcePath: '/test/resource.tsx', getOptions, getLogger }, source),
    ).toBe(`
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/dynamic/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerInfo).not.toHaveBeenCalled();
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('does not transform index imports where the relevant dynamic module is unknown', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({
      dynamicModuleMaps: {
        '@patternfly/react-icons': {
          PlayIcon: 'dist/dynamic/icons/play-icon',
        },
      },
    }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

    const source = `
import * as React from 'react';
import { PlayIcon, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction({ resourcePath: '/test/resource.tsx', getOptions, getLogger }, source),
    ).toBe(`
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerInfo).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn).toHaveBeenLastCalledWith(
      'No dynamic module found for StopIcon in @patternfly/react-icons',
    );
  });

  it('does not transform non-index imports', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({
      dynamicModuleMaps: {
        '@patternfly/react-icons': {
          PlayIcon: 'dist/dynamic/icons/play-icon',
        },
      },
    }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

    const source = `
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/esm/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction({ resourcePath: '/test/resource.tsx', getOptions, getLogger }, source),
    ).toBe(`
import * as React from 'react';
import { PlayIcon } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/esm/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerInfo).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn).toHaveBeenLastCalledWith(
      'Non-index and non-dynamic module import @patternfly/react-icons/dist/esm/icons/stop-icon',
    );
  });

  it('preserves named aliases of transformed imports', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({
      dynamicModuleMaps: {
        '@patternfly/react-icons': {
          PlayIcon: 'dist/dynamic/icons/play-icon',
          StopIcon: 'dist/dynamic/icons/stop-icon',
        },
      },
    }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

    const source = `
import * as React from 'react';
import { PlayIcon as PF_Icon_Play, StopIcon } from '@patternfly/react-icons';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`;

    expect(
      callLoaderFunction({ resourcePath: '/test/resource.tsx', getOptions, getLogger }, source),
    ).toBe(`
import * as React from 'react';
import { PlayIcon as PF_Icon_Play } from '@patternfly/react-icons/dist/dynamic/icons/play-icon';
import { StopIcon } from '@patternfly/react-icons/dist/dynamic/icons/stop-icon';

export const TestComponent: React.FC = () => {
  return (<><PlayIcon /><StopIcon /></>);
};
`);

    expect(loggerInfo).not.toHaveBeenCalled();
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('preserves leading comments of transformed imports', () => {
    const getOptions = jest.fn<DynamicModuleImportLoaderOptions>(() => ({
      dynamicModuleMaps: {
        '@patternfly/react-icons': {
          PlayIcon: 'dist/dynamic/icons/play-icon',
          StopIcon: 'dist/dynamic/icons/stop-icon',
        },
      },
    }));

    const loggerInfo = jest.fn<void>();
    const loggerWarn = jest.fn<void>();
    const getLogger = () => ({ info: loggerInfo, warn: loggerWarn } as any);

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
      callLoaderFunction({ resourcePath: '/test/resource.tsx', getOptions, getLogger }, source),
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

    expect(loggerInfo).not.toHaveBeenCalled();
    expect(loggerWarn).not.toHaveBeenCalled();
  });
});
