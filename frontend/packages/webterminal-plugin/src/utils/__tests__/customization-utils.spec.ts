import { updatedWebTerminalExec, updatedWebTerminalTooling } from '../customization-utils';
import {
  execResource,
  execResourceWithNullComponents,
  execResourceWithNullSpec,
  execResourceWithoutEnvVariable,
  toolingResource,
  toolingResourceWithNullComponents,
  toolingResourceWithNullSpec,
} from './customization-utils-data';

describe('Web terminal customization Utils - web terminal tooling resource', () => {
  it('if resource spec is empty object', () => {
    const updatedToolingResource = updatedWebTerminalTooling(
      toolingResourceWithNullSpec,
      true,
      toolingResource.spec.components[0],
      'registry.redhat.io/web-terminal',
    );
    expect(updatedToolingResource.spec.components[0].container.image).toEqual(
      'registry.redhat.io/web-terminal',
    );
    expect(
      updatedToolingResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('true');
  });

  it('if spec.components is empty object', () => {
    const updatedToolingResource = updatedWebTerminalTooling(
      toolingResourceWithNullComponents,
      false,
      toolingResource.spec.components[0],
      'registry.redhat.io/web-terminal',
    );
    expect(updatedToolingResource.spec.components[0].container.image).toEqual(
      'registry.redhat.io/web-terminal',
    );
    expect(
      updatedToolingResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('false');
  });

  it('override existing image value', () => {
    const updatedToolingResource = updatedWebTerminalTooling(
      toolingResource,
      false,
      toolingResource.spec.components[0],
      'registry.redhat.io/web-terminal',
    );
    expect(updatedToolingResource.spec.components[0].container.image).toEqual(
      'registry.redhat.io/web-terminal',
    );
    expect(
      updatedToolingResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('false');
  });
});

describe('Web terminal customization Utils - web terminal exec resource', () => {
  it('if resource spec is empty object', () => {
    const updatedExecResource = updatedWebTerminalExec(
      execResourceWithNullSpec,
      true,
      execResource.spec.components[0],
      '15m',
    );
    const timeoutEnvVariable = updatedExecResource.spec.components[0].container.env.find(
      (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
    );
    expect(timeoutEnvVariable.value).toEqual('15m');
    expect(
      updatedExecResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('true');
  });

  it('if spec.components is empty object', () => {
    const updatedExecResource = updatedWebTerminalExec(
      execResourceWithNullComponents,
      false,
      execResource.spec.components[0],
      '15m',
    );
    const timeoutEnvVariable = updatedExecResource.spec.components[0].container.env.find(
      (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
    );
    expect(timeoutEnvVariable.value).toEqual('15m');
    expect(
      updatedExecResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('false');
  });

  it('override existing timeout value', () => {
    const updatedExecResource = updatedWebTerminalExec(
      execResource,
      false,
      execResource.spec.components[0],
      '10m',
    );
    const timeoutEnvVariable = updatedExecResource.spec.components[0].container.env.find(
      (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
    );
    expect(timeoutEnvVariable.value).toEqual('10m');
    expect(
      updatedExecResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('false');
  });

  it('if environment variables is empty array', () => {
    const updatedExecResource = updatedWebTerminalExec(
      execResourceWithoutEnvVariable,
      false,
      execResourceWithoutEnvVariable.spec.components[0],
      '5h',
    );
    const timeoutEnvVariable = updatedExecResource.spec.components[0].container.env.find(
      (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
    );
    expect(timeoutEnvVariable?.value).toEqual('5h');
    expect(
      updatedExecResource.metadata.annotations['web-terminal.redhat.com/unmanaged-state'],
    ).toEqual('false');
  });
});
