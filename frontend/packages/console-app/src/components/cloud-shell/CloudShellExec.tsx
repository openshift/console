import * as React from 'react';
import { Button, EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { Base64 } from 'js-base64';
import { useTranslation } from 'react-i18next';
import { connect, Dispatch } from 'react-redux';
import { PodModel } from '@console/internal/models';
import { resourceURL, K8sKind } from '@console/internal/module/k8s';
import { WSFactory } from '@console/internal/module/ws-factory';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/features';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { FLAGS } from '@console/shared';
import { setCloudShellActive } from '../../redux/actions/cloud-shell-actions';
import {
  getCloudShellCR,
  CLOUD_SHELL_STOPPED_BY_ANNOTATION,
  startWorkspace,
  CloudShellResource,
} from './cloud-shell-utils';
import ExecuteCommand from './ExecuteCommand';
import Terminal, { ImperativeTerminalType } from './Terminal';
import TerminalLoadingBox from './TerminalLoadingBox';
import useActivityTick from './useActivityTick';

import './CloudShellExec.scss';

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

type Props = {
  workspaceName: string;
  container: string;
  podname: string;
  namespace: string;
  shcommand?: string[];
  workspaceModel: K8sKind;
};

type StateProps = {
  impersonate?: {
    subprotocols: string[];
  };
};

type DispatchProps = {
  onActivate: (active: boolean) => void;
};

type CloudShellExecProps = Props & DispatchProps & StateProps & WithFlagsProps;

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

const CloudShellExec: React.FC<CloudShellExecProps> = ({
  workspaceName,
  container,
  podname,
  namespace,
  shcommand,
  flags,
  impersonate,
  workspaceModel,
  onActivate,
}) => {
  const [wsOpen, setWsOpen] = React.useState<boolean>(false);
  const [wsError, setWsError] = React.useState<string>();
  const [wsReopening, setWsReopening] = React.useState<boolean>(false);
  const [customResource, setCustomResource] = React.useState<CloudShellResource>();
  const ws = React.useRef<WSFactory>();
  const terminal = React.useRef<ImperativeTerminalType>();
  const { t } = useTranslation();

  const tick = useActivityTick(workspaceName, namespace);

  const onData = React.useCallback(
    (data: string): void => {
      tick();
      ws.current?.send(`0${Base64.encode(data)}`);
    },
    [tick],
  );

  const handleResize = React.useCallback((cols: number, rows: number) => {
    const data = Base64.encode(JSON.stringify({ Height: rows, Width: cols }));
    ws.current?.send(`4${data}`);
  }, []);

  const onCommand = React.useCallback((command: string): void => {
    ws.current?.send(`0${Base64.encode(`${command}\n`)}`);
  }, []);

  React.useEffect(() => {
    onActivate(true);
    return () => {
      onActivate(false);
    };
  }, [onActivate]);

  React.useEffect(() => {
    let unmounted: boolean;
    const usedClient = flags[FLAGS.OPENSHIFT] ? 'oc' : 'kubectl';
    const cmd = shcommand || ['sh', '-i', '-c', 'TERM=xterm sh'];
    const subprotocols = (impersonate?.subprotocols || []).concat('base64.channel.k8s.io');

    const urlOpts = {
      ns: namespace,
      name: podname,
      path: 'exec',
      queryParams: {
        stdout: '1',
        stdin: '1',
        stderr: '1',
        tty: '1',
        container,
        command: cmd.map((c) => encodeURIComponent(c)).join('&command='),
      },
    };

    const path = resourceURL(PodModel, urlOpts);
    const wsOpts = {
      host: 'auto',
      reconnect: true,
      jsonParse: false,
      path,
      subprotocols,
    };

    const websocket: WSFactory = new WSFactory(`${podname}-terminal`, wsOpts);
    let previous;

    websocket
      .onmessage((msg) => {
        const currentTerminal = terminal.current;
        // error channel
        if (msg[0] === '3') {
          if (previous.includes(NO_SH)) {
            const errMsg = `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${namespace} exec ${podname} -ti <command>`;
            currentTerminal && currentTerminal.reset();
            currentTerminal && currentTerminal.onConnectionClosed(errMsg);
            websocket.destroy();
            previous = '';
            return;
          }
        }
        tick();
        const data = Base64.decode(msg.slice(1));
        currentTerminal && currentTerminal.onDataReceived(data);
        previous = data;
      })
      .onopen(() => {
        const currentTerminal = terminal.current;
        currentTerminal && currentTerminal.reset();
        previous = '';
        if (!unmounted) setWsOpen(true);
      })
      .onclose((evt) => {
        if (!evt || evt.wasClean === true) {
          return;
        }

        setWsOpen(false);

        // Check the Cloud Shell to see if it has any hints as to why the terminal connection was closed
        const cloudShellCR = getCloudShellCR(workspaceModel, workspaceName, namespace);
        let stoppedByError;
        cloudShellCR
          .then((cr) => {
            const stopReason = cr.metadata.annotations[CLOUD_SHELL_STOPPED_BY_ANNOTATION];
            if (stopReason) {
              stoppedByError = t(
                'console-app~The terminal connection has closed due to {{reason}}.',
                { reason: stopReason },
              );
            }
            setCustomResource(cr);
          })
          .catch((err) => {
            stoppedByError = err;
          })
          .finally(() => {
            const error =
              evt.reason || stoppedByError || t('console-app~The terminal connection has closed.');
            const currentTerminal = terminal.current;
            currentTerminal && currentTerminal.onConnectionClosed(error);
            websocket.destroy();
            if (!unmounted) setWsError(error);
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
          });
      }) // eslint-disable-next-line no-console
      .onerror((evt) => console.error(`WS error?! ${evt}`));

    if (ws.current !== websocket) {
      ws.current && ws.current.destroy();
      ws.current = websocket;
      const currentTerminal = terminal.current;
      currentTerminal &&
        currentTerminal.onConnectionClosed(
          t('console-app~connecting to {{container}}', { container }),
        );
    }

    setWsReopening(false);

    return () => {
      unmounted = true;
      websocket.destroy();
    };
  }, [
    tick,
    container,
    flags,
    impersonate,
    namespace,
    podname,
    shcommand,
    t,
    workspaceName,
    workspaceModel,
    wsReopening,
  ]);

  if (wsError) {
    return (
      <div className="co-cloudshell-exec__container-error">
        <EmptyState>
          <EmptyStateBody className="co-cloudshell-exec__error-msg">{wsError}</EmptyStateBody>
          <Button
            variant="primary"
            onClick={() => {
              if (customResource && customResource.status.phase !== 'Running') {
                startWorkspace(customResource);
              } else if (!wsReopening) {
                setWsReopening(true);
              }
              setWsError(undefined);
            }}
          >
            {customResource.status.phase === 'Running'
              ? t('console-app~Reconnect to terminal')
              : t('console-app~Restart terminal')}
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (wsOpen) {
    return (
      <>
        <div className="co-cloudshell-terminal__container">
          <Terminal onData={onData} onResize={handleResize} ref={terminal} />
        </div>
        <ExecuteCommand onCommand={onCommand} />
      </>
    );
  }

  return (
    <div className="co-cloudshell-terminal__container">
      <TerminalLoadingBox />
    </div>
  );
};

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onActivate: (active: boolean) => dispatch(setCloudShellActive(active)),
});

export default connect<StateProps, DispatchProps>(
  impersonateStateToProps,
  dispatchToProps,
)(connectToFlags<CloudShellExecProps & WithFlagsProps>(FLAGS.OPENSHIFT)(CloudShellExec));
