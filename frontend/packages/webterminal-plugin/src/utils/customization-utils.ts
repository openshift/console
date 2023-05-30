import {
  CloudShellComponent,
  CloudShellResource,
} from '../components/cloud-shell/cloud-shell-utils';

export const getUpdatedComponentTimeout = (
  existingTerminalExecComponents: CloudShellComponent[],
  timeout: string,
  terminalExecResource: CloudShellComponent,
) => {
  if (
    (!existingTerminalExecComponents || existingTerminalExecComponents?.length === 0) &&
    timeout
  ) {
    return [
      {
        name: 'web-terminal-exec',
        container: {
          env: [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout }],
          image: '',
        },
      },
    ];
  }

  const terminalIdleTimeoutEnvVariable = terminalExecResource?.container?.env?.find(
    (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
  );

  if (terminalExecResource && !terminalIdleTimeoutEnvVariable?.value && timeout) {
    let newEnvVariables;
    if (terminalExecResource?.container?.env) {
      newEnvVariables = [
        ...terminalExecResource.container.env,
        { name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout },
      ];
    } else {
      newEnvVariables = [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout }];
    }
    terminalExecResource.container = {
      ...terminalExecResource.container,
      env: newEnvVariables,
    };
    return existingTerminalExecComponents;
  }
  if (terminalExecResource) {
    if (timeout && terminalIdleTimeoutEnvVariable?.value) {
      terminalIdleTimeoutEnvVariable.value = timeout;
    } else if (terminalIdleTimeoutEnvVariable && !timeout) {
      terminalExecResource.container.env = terminalExecResource.container.env.filter(
        (e) => e.name !== 'WEB_TERMINAL_IDLE_TIMEOUT',
      );
    }
    return existingTerminalExecComponents;
  }
  if (timeout) {
    return [
      ...existingTerminalExecComponents,
      {
        name: 'web-terminal-exec',
        container: {
          env: [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout }],
          image: '',
        },
      },
    ];
  }
  return existingTerminalExecComponents;
};

export const updatedWebTerminalExec = (
  webTerminalExec: CloudShellResource,
  timeoutCheckBox: boolean,
  terminalExecResource: CloudShellComponent,
  csTimeout: string,
): CloudShellResource => {
  return {
    ...webTerminalExec,
    metadata: {
      ...webTerminalExec?.metadata,
      annotations: {
        ...webTerminalExec?.metadata?.annotations,
        'web-terminal.redhat.com/unmanaged-state': timeoutCheckBox ? 'true' : 'false',
      },
    },
    spec: {
      ...webTerminalExec?.spec,
      components: getUpdatedComponentTimeout(
        webTerminalExec?.spec?.components,
        csTimeout,
        terminalExecResource,
      ),
    },
  };
};

export const getUpdatedComponentImage = (
  existingTerminalToolingComponents: CloudShellComponent[],
  newImage: string,
  terminalToolingResource: CloudShellComponent,
) => {
  if (!existingTerminalToolingComponents || existingTerminalToolingComponents?.length === 0) {
    return [
      {
        name: 'web-terminal-tooling',
        container: {
          image: newImage,
        },
      },
    ];
  }
  if (terminalToolingResource) {
    terminalToolingResource.container.image = newImage;
    return existingTerminalToolingComponents;
  }
  return [
    ...existingTerminalToolingComponents,
    {
      name: 'web-terminal-tooling',
      container: {
        image: newImage,
      },
    },
  ];
};

export const updatedWebTerminalTooling = (
  webTerminalTooling: CloudShellResource,
  imageCheckBox: boolean,
  terminalToolingResource: CloudShellComponent,
  image: string,
): CloudShellResource => {
  return {
    ...webTerminalTooling,
    metadata: {
      ...webTerminalTooling?.metadata,
      annotations: {
        ...webTerminalTooling?.metadata?.annotations,
        'web-terminal.redhat.com/unmanaged-state': imageCheckBox ? 'true' : 'false',
      },
    },
    spec: {
      ...webTerminalTooling?.spec,
      components: getUpdatedComponentImage(
        webTerminalTooling?.spec?.components,
        image,
        terminalToolingResource,
      ),
    },
  };
};
