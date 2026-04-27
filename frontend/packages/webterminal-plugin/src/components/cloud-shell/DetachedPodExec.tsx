import type { FC } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, EmptyState, EmptyStateBody, EmptyStateFooter } from '@patternfly/react-core';
import { Base64 } from 'js-base64';
import { useTranslation } from 'react-i18next';
import { getImpersonate } from '@console/dynamic-plugin-sdk';
import { PodModel } from '@console/internal/models';
import { takeDetachedWebSocket } from '@console/internal/module/detached-ws-registry';
import { resourceURL } from '@console/internal/module/k8s';
import { WSFactory } from '@console/internal/module/ws-factory';
import store from '@console/internal/redux';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import type { ImperativeTerminalType } from './Terminal';
import Terminal from './Terminal';
import TerminalLoadingBox from './TerminalLoadingBox';
import './CloudShellExec.scss';

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

type DetachedPodExecProps = {
  sessionId: string;
  podName: string;
  namespace: string;
  containerName: string;
  command?: string[];
};

const DetachedPodExec: FC<DetachedPodExecProps> = ({
  sessionId,
  podName,
  namespace,
  containerName,
  command,
}) => {
  const [wsOpen, setWsOpen] = useState(false);
  const [wsError, setWsError] = useState<string>();
  const [reconnecting, setReconnecting] = useState(false);
  const ws = useRef<WSFactory>();
  const terminal = useRef<ImperativeTerminalType>();
  const { t } = useTranslation();
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);

  const onData = useCallback((data: string): void => {
    ws.current?.send(`0${Base64.encode(data)}`);
  }, []);

  const handleResize = useCallback((cols: number, rows: number) => {
    const data = Base64.encode(JSON.stringify({ Height: rows, Width: cols }));
    ws.current?.send(`4${data}`);
  }, []);

  useEffect(() => {
    let unmounted = false;
    const usedClient = isOpenShift ? 'oc' : 'kubectl';
    const cmd = command || ['sh', '-i', '-c', 'TERM=xterm sh'];

    const transferred = takeDetachedWebSocket(sessionId);
    let websocket: any;

    if (transferred) {
      websocket = transferred;
      websocket
        .onmessage((msg: string) => {
          const data = Base64.decode(msg.slice(1));
          terminal.current?.onDataReceived(data);
        })
        .onclose((evt: any) => {
          if (!evt || evt.wasClean === true) {
            return;
          }
          const error = evt.reason || t('webterminal-plugin~The terminal connection has closed.');
          terminal.current?.onConnectionClosed(error);
          websocket.destroy();
          if (!unmounted) {
            setWsOpen(false);
            setWsError(error);
          }
        })
        // eslint-disable-next-line no-console
        .onerror((evt: any) => console.error(`WS error?! ${evt}`));

      ws.current?.destroy();
      ws.current = websocket;
      if (!unmounted) {
        setWsOpen(true);
        setTimeout(() => {
          websocket.send(`0${Base64.encode('\n')}`);
        }, 200);
      }
    } else {
      const impersonate = getImpersonate(store.getState()) || { subprotocols: [] };
      const subprotocols = (impersonate.subprotocols || []).concat('base64.channel.k8s.io');

      const urlOpts = {
        ns: namespace,
        name: podName,
        path: 'exec',
        queryParams: {
          stdout: '1',
          stdin: '1',
          stderr: '1',
          tty: '1',
          container: containerName,
          command: cmd.map((c) => encodeURIComponent(c)).join('&command='),
        },
      };

      const path = resourceURL(PodModel, urlOpts);
      websocket = new WSFactory(`${podName}-detached-terminal`, {
        host: 'auto',
        reconnect: true,
        jsonParse: false,
        path,
        subprotocols,
      });

      let previous = '';

      websocket
        .onmessage((msg: string) => {
          if (msg[0] === '3') {
            if (previous.includes(NO_SH)) {
              const errMsg = `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${namespace} exec ${podName} -ti <command>`;
              terminal.current?.reset();
              terminal.current?.onConnectionClosed(errMsg);
              websocket.destroy();
              previous = '';
              return;
            }
          }
          const data = Base64.decode(msg.slice(1));
          terminal.current?.onDataReceived(data);
          previous = data;
        })
        .onopen(() => {
          terminal.current?.reset();
          previous = '';
          if (!unmounted) {
            setWsOpen(true);
          }
        })
        .onclose((evt: any) => {
          if (!evt || evt.wasClean === true) {
            return;
          }
          const error = evt.reason || t('webterminal-plugin~The terminal connection has closed.');
          terminal.current?.onConnectionClosed(error);
          websocket.destroy();
          if (!unmounted) {
            setWsOpen(false);
            setWsError(error);
          }
        })
        // eslint-disable-next-line no-console
        .onerror((evt: any) => console.error(`WS error?! ${evt}`));

      if (ws.current !== websocket) {
        ws.current?.destroy();
        ws.current = websocket;
        terminal.current?.onConnectionClosed(
          t('webterminal-plugin~connecting to {{container}}', { container: containerName }),
        );
      }
    }

    setReconnecting(false);

    return () => {
      unmounted = true;
      websocket.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podName, namespace, containerName, command, isOpenShift, t, reconnecting]);

  if (wsError) {
    return (
      <div className="co-cloudshell-exec__container-error">
        <EmptyState>
          <EmptyStateBody className="co-cloudshell-exec__error-msg">{wsError}</EmptyStateBody>
          <EmptyStateFooter>
            <Button
              variant="primary"
              onClick={() => {
                setWsError(undefined);
                setReconnecting(true);
              }}
            >
              {t('webterminal-plugin~Reconnect to terminal')}
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </div>
    );
  }

  if (wsOpen) {
    return (
      <div className="co-cloudshell-terminal__container">
        <Terminal onData={onData} onResize={handleResize} ref={terminal} />
      </div>
    );
  }

  return (
    <div className="co-cloudshell-terminal__container">
      <TerminalLoadingBox
        message={t('webterminal-plugin~Connecting to {{podName}}/{{containerName}}...', {
          podName,
          containerName,
        })}
      />
    </div>
  );
};

export default DetachedPodExec;
