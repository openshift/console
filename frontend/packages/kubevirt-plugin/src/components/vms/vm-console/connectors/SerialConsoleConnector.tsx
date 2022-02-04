import * as React from 'react';
import { constants, SerialConsole } from '@patternfly/react-console';
import { useTranslation } from 'react-i18next';
import { WSFactory } from '@console/internal/module/ws-factory';
import { ConsoleType } from '../../../../constants/vm/console-type';
import { getName } from '../../../../selectors';
import { getSerialConsoleConnectionDetails } from '../../../../selectors/vmi';
import { VMIKind } from '../../../../types';

const { CONNECTED, DISCONNECTED, LOADING } = constants;

// The protocol is complex and backend implementation not stable - let's keep logging to simplify debugging in production.
const { debug, info, error } = console;

interface WebSocket {
  destroy(): void;
  send(data: any): void;
}

// KubeVirt serial console is accessed via WebSocket proxy in k8s API.
// Protocol used is "plain.kubevirt.io", means binary and single channel - forwarding of unix socket only (vmhandler sources).
const SerialConsoleConnector: React.FC<SerialConsoleConnectorProps> = ({ vmi, setConsoleType }) => {
  const { host, path } = getSerialConsoleConnectionDetails(vmi);
  const [status, setStatus] = React.useState(LOADING);
  const terminalRef = React.useRef(null);
  const socket = React.useRef<WebSocket>(null);
  const { t } = useTranslation();

  React.useEffect(() => {
    setConsoleType(ConsoleType.SERIAL);
  }, [setConsoleType]);

  const onBackendDisconnected = React.useCallback((event?: any) => {
    debug('Backend has disconnected');
    if (terminalRef.current) {
      terminalRef.current.onConnectionClosed('Reason for disconnect provided by backend.');
    }

    if (event?.reason) {
      info('Serial console connection closed, reason: ', event.reason);
    }

    socket?.current?.destroy();
    setStatus(DISCONNECTED); // will close the terminal window
  }, []);

  const setConnected = React.useCallback(() => {
    setStatus(CONNECTED);
  }, [setStatus]);

  const onDataFromBackend = React.useCallback((data) => {
    // plain.kubevirt.io is binary and single-channel protocol
    debug('Backend sent data, pass it to the UI component. [', data, ']');

    if (terminalRef.current) {
      const reader = new FileReader();
      reader.addEventListener('loadend', (e) => {
        // Blob to text transformation ...
        const target = (e.target || e.srcElement) as any;
        const text = target.result;
        terminalRef.current.onDataReceived(text);
      });
      reader.readAsText(data);
    }
  }, []);

  const onConnect = React.useCallback(() => {
    debug('SerialConsoleConnector.onConnect(), status = ', status);

    if (socket.current) {
      socket.current.destroy();
      setStatus(LOADING);
    }

    const websocketOptions = {
      host,
      path,
      reconnect: false,
      jsonParse: false,
      subprotocols: ['plain.kubevirt.io'],
    };

    socket.current = new WSFactory(`${getName(vmi)}-serial`, websocketOptions)
      .onmessage(onDataFromBackend)
      .onopen(setConnected)
      .onclose(onBackendDisconnected)
      .onerror((event) => {
        error('WebSocket error received: ', event);
      });
  }, [status, host, path, vmi, onDataFromBackend, setConnected, onBackendDisconnected]);

  const onData = React.useCallback((data) => {
    debug(
      'UI terminal component produced data, i.e. a key was pressed, pass it to backend. [',
      data,
      ']',
    );
    // data is resent back from backend so _will_ pass through onDataFromBackend
    socket?.current?.send(new Blob([data]));
  }, []);

  return (
    <SerialConsole
      fontFamily="monospace"
      fontSize={12}
      onConnect={onConnect}
      onData={onData}
      onDisconnect={onBackendDisconnected}
      ref={terminalRef}
      status={status}
      textConnect={t('kubevirt-plugin~Connect')}
      textDisconnect={t('kubevirt-plugin~Disconnect')}
      textDisconnected={t('kubevirt-plugin~Click Connect to open serial console.')}
      textLoading={t('kubevirt-plugin~Loading ...')}
      textReset={t('kubevirt-plugin~Reset')}
    />
  );
};
SerialConsoleConnector.displayName = constants.SERIAL_CONSOLE_TYPE; // for child-recognition by AccessConsoles

type SerialConsoleConnectorProps = {
  vmi: VMIKind;
  setConsoleType: (consoleType: ConsoleType) => void;
};

export default SerialConsoleConnector;
