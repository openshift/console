import * as React from 'react';
import { constants, SerialConsole } from '@patternfly/react-console';
import { WSFactory } from '@console/internal/module/ws-factory';
import { getName } from '../../../../selectors';
import { getSerialConsoleConnectionDetails } from '../../../../selectors/vmi';
import { VMIKind } from '../../../../types';

const { CONNECTED, DISCONNECTED, LOADING } = constants;

// The protocol is complex and backend implementation not stable - let's keep logging to simplify debugging in production.
const { debug, info, error } = console;

const onResize = (rows, cols) => {
  debug(
    'UI has been resized. Pass this info to backend. [',
    rows,
    ', ',
    cols,
    ']. Ignoring since recently not supported by backend.',
  );
};

interface WebSocket {
  destroy(): void;
  send(data: any): void;
}

// KubeVirt serial console is accessed via WebSocket proxy in k8s API.
// Protocol used is "plain.kubevirt.io", means binary and single channel - forwarding of unix socket only (vmhandler sources).
const SerialConsoleConnector: React.FC<SerialConsoleConnectorProps> = ({ vmi }) => {
  const { host, path } = getSerialConsoleConnectionDetails(vmi);
  const [status, setStatus] = React.useState(LOADING);
  const terminalRef = React.useRef(null);
  const socket = React.useRef<WebSocket>(null);

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
      id="serial-console"
      onConnect={onConnect}
      onData={onData}
      onDisconnect={onBackendDisconnected}
      onResize={onResize}
      ref={terminalRef}
      status={status}
    />
  );
};
SerialConsoleConnector.displayName = constants.SERIAL_CONSOLE_TYPE; // for child-recognition by AccessConsoles

type SerialConsoleConnectorProps = {
  vmi: VMIKind;
};

export default SerialConsoleConnector;
