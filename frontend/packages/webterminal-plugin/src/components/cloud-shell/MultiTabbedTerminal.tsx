import type { FC } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, Tab } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { cleanupDetachedResource } from '@console/internal/module/detached-ws-registry';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { FLAG_DEVWORKSPACE } from '../../const';
import { removeDetachedSession } from '../../redux/actions/cloud-shell-actions';
import { useDetachedSessions } from '../../redux/reducers/cloud-shell-selectors';
import { sendActivityTick } from './cloud-shell-utils';
import CloudShellTerminal from './CloudShellTerminal';
import DetachedPodExec from './DetachedPodExec';
import { TICK_INTERVAL } from './useActivityTick';
import './MultiTabbedTerminal.scss';

const MAX_TERMINAL_TABS = 8;
const DETACHED_PREFIX = 'detached-';

interface MultiTabbedTerminalProps {
  onClose?: () => void;
}

export const MultiTabbedTerminal: FC<MultiTabbedTerminalProps> = ({ onClose }) => {
  const devWorkspaceAvailable = useFlag(FLAG_DEVWORKSPACE);
  const [terminalTabs, setTerminalTabs] = useState<number[]>(devWorkspaceAvailable ? [1] : []);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(devWorkspaceAvailable ? 1 : 0);
  const [tickNamespace, setTickNamespace] = useState<string>(null);
  const [tickWorkspace, setTickWorkspace] = useState<string>(null);
  const { t } = useTranslation('webterminal-plugin');
  const fireTelemetryEvent = useTelemetry();
  const dispatch = useConsoleDispatch();
  const detachedSessions = useDetachedSessions();
  const prevDetachedCountRef = useRef(detachedSessions.length);

  const tick = useCallback(() => {
    return (
      typeof activeTabKey === 'number' &&
      tickNamespace &&
      tickWorkspace &&
      sendActivityTick(tickWorkspace, tickNamespace)
    );
  }, [activeTabKey, tickWorkspace, tickNamespace]);

  useEffect(() => {
    let startTime;
    let tickReq;
    const handleTick = (timestamp) => {
      if (!startTime || timestamp - startTime >= TICK_INTERVAL) {
        startTime = timestamp;
        tick();
      }
      tickReq = window.requestAnimationFrame(handleTick);
    };

    tickReq = window.requestAnimationFrame(handleTick);

    return () => {
      window.cancelAnimationFrame(tickReq);
    };
  }, [tick]);

  useEffect(() => {
    if (detachedSessions.length > prevDetachedCountRef.current) {
      const newest = detachedSessions[detachedSessions.length - 1];
      setActiveTabKey(`${DETACHED_PREFIX}${newest.id}`);
    }
    prevDetachedCountRef.current = detachedSessions.length;
  }, [detachedSessions]);

  const totalTabCount = terminalTabs.length + detachedSessions.length;

  const addNewTerminal = devWorkspaceAvailable
    ? () => {
        if (totalTabCount < MAX_TERMINAL_TABS) {
          const tabs = [...terminalTabs];
          const newTerminalNumber = (terminalTabs[terminalTabs.length - 1] || 0) + 1;
          tabs.push(newTerminalNumber);
          setTerminalTabs(tabs);
          setActiveTabKey(newTerminalNumber);
          fireTelemetryEvent('Web Terminal New Tab');
        }
      }
    : undefined;

  const handleTabClose = useCallback(
    (_, eventKey: string | number) => {
      const isDetached = typeof eventKey === 'string' && eventKey.startsWith(DETACHED_PREFIX);

      if (isDetached) {
        const sessionId = (eventKey as string).slice(DETACHED_PREFIX.length);
        const closedSession = detachedSessions.find((s) => s.id === sessionId);
        const remaining = detachedSessions.filter((s) => s.id !== sessionId);
        if (closedSession?.cleanup) {
          cleanupDetachedResource(closedSession.cleanup);
        }
        if (remaining.length === 0 && terminalTabs.length === 0) {
          dispatch(removeDetachedSession(sessionId));
          onClose?.();
          return;
        }
        dispatch(removeDetachedSession(sessionId));
        if (activeTabKey === eventKey) {
          if (remaining.length > 0) {
            setActiveTabKey(`${DETACHED_PREFIX}${remaining[0].id}`);
          } else if (terminalTabs.length > 0) {
            setActiveTabKey(terminalTabs[terminalTabs.length - 1]);
          }
        }
        return;
      }

      const numKey = eventKey as number;
      const tabIndex = terminalTabs.indexOf(numKey);
      if (tabIndex === -1) return;

      if (terminalTabs.length === 1 && detachedSessions.length === 0) {
        onClose?.();
        return;
      }

      const tabs = [...terminalTabs];
      if (numKey === activeTabKey) {
        if (tabIndex > 0) {
          setActiveTabKey(tabs[tabIndex - 1]);
        } else if (tabs.length > 1) {
          setActiveTabKey(tabs[1]);
        } else if (detachedSessions.length > 0) {
          setActiveTabKey(`${DETACHED_PREFIX}${detachedSessions[0].id}`);
        }
      }
      tabs.splice(tabIndex, 1);
      setTerminalTabs(tabs);
    },
    [activeTabKey, terminalTabs, detachedSessions, dispatch, onClose],
  );

  const getWorkspaceNamespace = (namespace: string, terminal: number) => {
    terminal === activeTabKey && namespace !== tickNamespace && setTickNamespace(namespace);
  };

  const getWorkspaceName = (name: string, terminal: number) => {
    terminal === activeTabKey && name !== tickWorkspace && setTickWorkspace(name);
  };

  const closeHandler = totalTabCount > 1 ? handleTabClose : onClose;

  return (
    <Tabs
      activeKey={activeTabKey}
      isBox
      data-test="multi-tab-terminal"
      className="co-cloud-shell-drawer__header"
      onClose={closeHandler}
      onAdd={addNewTerminal && totalTabCount < MAX_TERMINAL_TABS ? addNewTerminal : undefined}
      addButtonAriaLabel={t('Add new tab')}
    >
      {[
        ...terminalTabs.map((terminalNumber) => (
          <Tab
            className="co-multi-tabbed-terminal__tab"
            closeButtonAriaLabel={t('Close terminal tab')}
            data-test="multi-tab-terminal-tab"
            eventKey={terminalNumber}
            key={terminalNumber}
            onClick={() => setActiveTabKey(terminalNumber)}
            onMouseDown={(event) => {
              if (event.button === 1) {
                event.preventDefault();
                if (typeof closeHandler === 'function') {
                  closeHandler(event, terminalNumber);
                }
              }
            }}
            title={t('Terminal {{number}}', { number: terminalNumber })}
          >
            <CloudShellTerminal
              terminalNumber={terminalNumber}
              setWorkspaceName={getWorkspaceName}
              setWorkspaceNamespace={getWorkspaceNamespace}
            />
          </Tab>
        )),
        ...detachedSessions.map((session) => {
          const tabKey = `${DETACHED_PREFIX}${session.id}`;
          const label =
            session.podName.length > 20
              ? `${session.podName.slice(0, 17)}.../${session.containerName}`
              : `${session.podName}/${session.containerName}`;
          return (
            <Tab
              className="co-multi-tabbed-terminal__tab"
              closeButtonAriaLabel={t('Close terminal tab')}
              data-test="detached-terminal-tab"
              eventKey={tabKey}
              key={tabKey}
              onClick={() => setActiveTabKey(tabKey)}
              onMouseDown={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                  if (typeof closeHandler === 'function') {
                    closeHandler(event, tabKey);
                  }
                }
              }}
              title={label}
            >
              <DetachedPodExec
                sessionId={session.id}
                podName={session.podName}
                namespace={session.namespace}
                containerName={session.containerName}
                command={session.command}
              />
            </Tab>
          );
        }),
      ]}
    </Tabs>
  );
};
