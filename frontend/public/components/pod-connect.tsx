import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { useTranslation } from 'react-i18next';
import { ExpandIcon } from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import {
  Button,
  Alert,
  AlertActionLink,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { getImpersonate } from '@console/dynamic-plugin-sdk';

import store from '../redux';
import { ContainerLabel, ContainerSelect } from './utils/container-select';
import { LoadingBox } from './utils/status-box';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useFullscreen } from '@console/shared/src/hooks/useFullscreen';
import { Terminal, ImperativeTerminalType } from './terminal';
import { WSFactory } from '../module/ws-factory';
import { PodKind, resourceURL } from '../module/k8s';
import { PodModel } from '../models';
import { isWindowsPod } from '../module/k8s/pods';
import { css } from '@patternfly/react-styles';

// pod connect WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

const EXEC_COMMAND = 'exec';
const ATTACH_COMMAND = 'attach';
const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

type PodConnectProps = {
  obj: PodKind;
  attach?: boolean;
  initialContainer?: string;
  message?: React.ReactNode;
  infoMessage?: React.ReactNode;
};

export const PodConnect: Snail.FCC<PodConnectProps> = ({
  obj,
  attach,
  initialContainer,
  message,
  infoMessage,
}) => {
  const { t } = useTranslation('public');
  const terminalRef = useRef<ImperativeTerminalType>(null);
  const wsRef = useRef<any>(null);
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);
  const [fullscreenRef, toggleFullscreen, isFullscreen, canUseFullScreen] = useFullscreen();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeContainer, setActiveContainer] = useState<string>(
    initialContainer ||
      obj.metadata?.annotations?.['kubectl.kubernetes.io/default-container'] ||
      obj?.spec.containers[0].name,
  );

  const containers = useMemo(() => _.keyBy(_.get(obj, 'spec.containers', []), 'name'), [obj]);

  const podName = useMemo(() => obj.metadata?.name || '', [obj?.metadata?.name]);
  const namespace = useMemo(() => obj.metadata?.namespace || 'default', [obj?.metadata?.namespace]);
  // We are being more specific with the dependency array here to avoid additional rerenders when other fields in obj changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isWindows = useMemo(() => isWindowsPod(obj), [obj?.spec?.tolerations]);

  const connect = useCallback(() => {
    const usedClient = isOpenShift ? 'oc' : 'kubectl';
    const command = isWindows ? ['cmd'] : ['sh', '-i', '-c', 'TERM=xterm sh'];
    const params = {
      ns: namespace,
      name: podName,
      path: attach ? ATTACH_COMMAND : EXEC_COMMAND,
      queryParams: {
        stdout: '1',
        stdin: '1',
        stderr: '1',
        tty: '1',
        container: activeContainer,
        ...(!attach && {
          command: command.map((c) => encodeURIComponent(c)).join('&command='),
        }),
      },
    };

    if (wsRef.current) {
      wsRef.current.destroy();
      terminalRef.current?.onConnectionClosed(`connecting to ${activeContainer}`);
    }

    const impersonate = getImpersonate(store.getState()) || { subprotocols: [] };
    const subprotocols = impersonate.subprotocols.concat('base64.channel.k8s.io');

    let previous = '';
    wsRef.current = new WSFactory(`${podName}-terminal`, {
      host: 'auto',
      reconnect: true,
      path: resourceURL(PodModel, params),
      jsonParse: false,
      subprotocols,
    })
      .onmessage((raw: string) => {
        // error channel
        if (raw[0] === '3') {
          if (previous.includes(NO_SH)) {
            terminalRef.current?.reset();
            terminalRef.current?.onConnectionClosed(
              `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${namespace} exec ${name} -ti <command>`,
            );
            wsRef.current.destroy();
            previous = '';
            return;
          }
        }
        const data = Base64.decode(raw.slice(1));
        terminalRef.current?.onDataReceived(data);
        previous = data;
      })
      .onopen(() => {
        terminalRef.current?.reset();
        previous = '';
        setOpen(true);
        setError(null);
      })
      .onclose((evt: any) => {
        if (!evt || evt.wasClean === true) {
          return;
        }
        const errorMsg = evt.reason || t('The terminal connection has closed.');
        setError(errorMsg);
        terminalRef.current?.onConnectionClosed(errorMsg);
        wsRef.current.destroy();
      })
      // eslint-disable-next-line no-console
      .onerror((evt: any) => console.error(`WS error?! ${evt}`));
  }, [podName, namespace, isWindows, attach, activeContainer, t, isOpenShift]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();
    return () => {
      const exitCode = 'exit\r';
      if (wsRef.current) {
        exitCode.split('').forEach((char) => wsRef.current.send(`0${Base64.encode(char)}`));
        wsRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);

  // Container change handler
  const onChangeContainer = useCallback(
    (container: string) => {
      const name = containers?.[container]?.name;
      if (!name) {
        // eslint-disable-next-line no-console
        console.warn(`no name, how did that happen? ${container}`);
        return;
      }
      if (name === activeContainer) {
        return;
      }
      setActiveContainer(name);
    },
    [containers, activeContainer],
  );

  // Reconnect when activeContainer changes
  useEffect(() => {
    connect();
    terminalRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContainer]);

  // Terminal event handlers
  const onResize = useCallback((rows: number, cols: number) => {
    const data = Base64.encode(JSON.stringify({ Height: rows, Width: cols }));
    wsRef.current && wsRef.current.send(`4${data}`);
  }, []);

  const onData = useCallback((data: string) => {
    wsRef.current && wsRef.current.send(`0${Base64.encode(data)}`);
  }, []);

  let contents = <LoadingBox />;
  if (error) {
    contents = <Terminal onResize={() => {}} onData={() => {}} ref={terminalRef} />;
  } else if (open) {
    contents = <Terminal onResize={onResize} onData={onData} ref={terminalRef} />;
  }

  const reconnectAction =
    obj.status.phase === 'Running' ? (
      <AlertActionLink onClick={connect}>{t('Reconnect')}</AlertActionLink>
    ) : null;

  return (
    <div ref={fullscreenRef}>
      <div className={css({ 'co-fullscreen': isFullscreen })}>
        {infoMessage}
        <Toolbar>
          <ToolbarContent alignItems="center">
            <Flex direction={{ default: 'column', sm: 'row' }}>
              <FlexItem>{t('Connecting to')}</FlexItem>
              <FlexItem>
                {Object.keys(containers).length > 1 ? (
                  <ContainerSelect
                    currentKey={activeContainer}
                    containers={containers}
                    onChange={onChangeContainer}
                  />
                ) : (
                  <ContainerLabel name={activeContainer} />
                )}
              </FlexItem>
            </Flex>
            {!error && canUseFullScreen && (
              <ToolbarGroup align={{ default: 'alignEnd' }}>
                <ToolbarItem>
                  <Button
                    icon={<ExpandIcon className="co-icon-space-r" />}
                    variant="link"
                    className="pf-m-link--align-right"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? t('Collapse') : t('Expand')}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            )}
          </ToolbarContent>
        </Toolbar>
        {error && (
          <Alert
            variant="warning"
            title={error}
            actionLinks={reconnectAction}
            isInline
            className="pf-v6-u-mb-md"
          />
        )}
        {message}
      </div>
      {contents}
    </div>
  );
};
