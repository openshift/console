import * as React from 'react';
import { Button, Tab, TabTitleText, TabTitleIcon } from '@patternfly/react-core';
import { CloseIcon, PlusIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@console/app/src/components/tabs';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { sendActivityTick } from './cloud-shell-utils';
import CloudShellTerminal from './CloudShellTerminal';
import { TICK_INTERVAL } from './useActivityTick';
import './MultiTabbedTerminal.scss';

const MAX_TERMINAL_TABS = 8;

interface MultiTabbedTerminalProps {
  onClose?: () => void;
}

export const MultiTabbedTerminal: React.FC<MultiTabbedTerminalProps> = ({ onClose }) => {
  const [terminalTabs, setTerminalTabs] = React.useState<number[]>([1]);
  const [activeTabKey, setActiveTabKey] = React.useState<number>(1);
  const [tickNamespace, setTickNamespace] = React.useState<string>(null);
  const [tickWorkspace, setTickWorkspace] = React.useState<string>(null);
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  const tick = React.useCallback(() => {
    return tickNamespace && tickWorkspace && sendActivityTick(tickWorkspace, tickNamespace);
  }, [tickWorkspace, tickNamespace]);

  React.useEffect(() => {
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

  const removeCurrentTerminal = (event, tabIndex: number) => {
    event.stopPropagation();
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

  return (
    <Tabs activeKey={activeTabKey} isBox data-test="multi-tab-terminal">
      {terminalTabs.map((terminalNumber, tabIndex) => (
        <Tab
          translate="no"
          className="co-multi-tabbed-terminal__tab"
          data-test="multi-tab-terminal-tab"
          eventKey={terminalNumber}
          key={terminalNumber}
          title={
            <div>
              <TabTitleText onClick={() => setActiveTabKey(terminalNumber)}>
                {t('webterminal-plugin~Terminal {{number}}', { number: terminalNumber })}
              </TabTitleText>
              <TabTitleIcon>
                {terminalTabs.length > 1 ? (
                  <Button
                    variant="plain"
                    style={{ padding: '0' }}
                    aria-label={t('webterminal-plugin~Close terminal tab')}
                    data-test="close-terminal-icon"
                    onClick={(event) => removeCurrentTerminal(event, tabIndex)}
                  >
                    <CloseIcon />
                  </Button>
                ) : (
                  <Button
                    variant="plain"
                    style={{ padding: '0' }}
                    aria-label={t('webterminal-plugin~Close terminal')}
                    data-test="close-terminal-icon"
                    onClick={onClose}
                  >
                    <CloseIcon />
                  </Button>
                )}
              </TabTitleIcon>
            </div>
          }
        >
          <CloudShellTerminal
            terminalNumber={terminalNumber}
            setWorkspaceName={getWorkspaceName}
            setWorkspaceNamespace={getWorkspaceNamespace}
          />
        </Tab>
      ))}
      {terminalTabs.length < MAX_TERMINAL_TABS && (
        <Tab
          translate="no"
          eventKey="add-tab"
          onClick={addNewTerminal}
          title={
            <TabTitleIcon>
              <Button
                variant="plain"
                style={{ padding: '0' }}
                aria-label={t('webterminal-plugin~Add new tab')}
                data-test="add-terminal-icon"
              >
                <PlusIcon />
              </Button>
            </TabTitleIcon>
          }
        />
      )}
    </Tabs>
  );
};

export default MultiTabbedTerminal;
