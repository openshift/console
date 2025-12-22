import { useState, useCallback, useEffect } from 'react';
import { Tabs, Tab } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { sendActivityTick } from './cloud-shell-utils';
import CloudShellTerminal from './CloudShellTerminal';
import { TICK_INTERVAL } from './useActivityTick';
import './MultiTabbedTerminal.scss';

const MAX_TERMINAL_TABS = 8;

interface MultiTabbedTerminalProps {
  onClose?: () => void;
}

export const MultiTabbedTerminal: React.FCC<MultiTabbedTerminalProps> = ({ onClose }) => {
  const [terminalTabs, setTerminalTabs] = useState<number[]>([1]);
  const [activeTabKey, setActiveTabKey] = useState<number>(1);
  const [tickNamespace, setTickNamespace] = useState<string>(null);
  const [tickWorkspace, setTickWorkspace] = useState<string>(null);
  const { t } = useTranslation('webterminal-plugin');
  const fireTelemetryEvent = useTelemetry();

  const tick = useCallback(() => {
    return tickNamespace && tickWorkspace && sendActivityTick(tickWorkspace, tickNamespace);
  }, [tickWorkspace, tickNamespace]);

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

  const addNewTerminal = () => {
    if (terminalTabs.length < MAX_TERMINAL_TABS) {
      const tabs = [...terminalTabs];
      const newTerminalNumber = terminalTabs[terminalTabs.length - 1] + 1;
      tabs.push(newTerminalNumber);
      setTerminalTabs(tabs);
      setActiveTabKey(newTerminalNumber);
      fireTelemetryEvent('Web Terminal New Tab');
    }
  };

  const removeCurrentTerminal = (_, eventKey: number) => {
    const tabIndex = terminalTabs.indexOf(eventKey);
    const tabs = [...terminalTabs];
    if (tabs[tabIndex] === activeTabKey) {
      setActiveTabKey(tabIndex > 0 ? tabs[tabIndex - 1] : tabs[tabs.length - 1]);
    }
    tabs.splice(tabIndex, 1);
    setTerminalTabs(tabs);
  };

  const getWorkspaceNamespace = (namespace: string, terminal: number) => {
    terminal === activeTabKey && namespace !== tickNamespace && setTickNamespace(namespace);
  };

  const getWorkspaceName = (name: string, terminal: number) => {
    terminal === activeTabKey && name !== tickWorkspace && setTickWorkspace(name);
  };

  const removeTabFunction = terminalTabs.length > 1 ? removeCurrentTerminal : onClose;

  return (
    <Tabs
      activeKey={activeTabKey}
      isBox
      data-test="multi-tab-terminal"
      className="co-cloud-shell-drawer__header"
      onClose={removeTabFunction}
      onAdd={terminalTabs.length < MAX_TERMINAL_TABS ? addNewTerminal : undefined}
      addButtonAriaLabel={t('Add new tab')}
    >
      {terminalTabs.map((terminalNumber) => (
        <Tab
          className="co-multi-tabbed-terminal__tab"
          closeButtonAriaLabel={t('Close terminal tab')}
          data-test="multi-tab-terminal-tab"
          eventKey={terminalNumber}
          key={terminalNumber}
          onClick={() => setActiveTabKey(terminalNumber)}
          onMouseDown={(event) => {
            // middle click to close
            if (event.button === 1) {
              event.preventDefault();
              if (typeof removeTabFunction === 'function') {
                removeTabFunction(event, terminalNumber);
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
      ))}
    </Tabs>
  );
};
