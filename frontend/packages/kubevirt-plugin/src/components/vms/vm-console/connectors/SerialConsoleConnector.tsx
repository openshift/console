import * as React from 'react';
import { constants, SerialConsole } from '@patternfly/react-console';
import { WSFactory } from '@console/internal/module/ws-factory';
import { getName } from '@console/shared/src/selectors';
import { getSerialConsoleConnectionDetails } from '../../../../selectors/vmi';
import { VMIKind } from '../../../../types';

const { CONNECTED, DISCONNECTED, LOADING } = constants;

// The protocol is complex and backend implementation not stable - let's keep logging to simplify debugging in production.
const { debug, info, error } = console;

const onResize = (rows, cols) => {
  debug(
    'UI has been resized, pass this info to backend. [',
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
  const [passKeys, setPassKeys] = React.useState(false);
  const [ws, setWS] = React.useState<WebSocket>();
  const childSerialconsole = React.useRef(null);

  const onBackendDisconnected = React.useCallback(
    (event?: any) => {
      debug('Backend has disconnected');
      if (childSerialconsole.current) {
        childSerialconsole.current.onConnectionClosed('Reason for disconnect provided by backend.');
      }

      if (event) {
        info('Serial console connection closed, reason: ', event.reason);
      }

      ws && ws.destroy && ws.destroy();

      setPassKeys(false);
      setStatus(DISCONNECTED); // will close the terminal window
    },
    [ws],
  );

  const setConnected = React.useCallback(() => {
    setStatus(CONNECTED);
    setPassKeys(true);
  }, [setStatus, setPassKeys]);

  const onDataFromBackend = React.useCallback((data) => {
    // plain.kubevirt.io is binary and single-channel protocol
    debug('Backend sent data, pass them to the UI component. [', data, ']');
    if (childSerialconsole.current) {
      const reader = new FileReader();
      reader.addEventListener('loadend', (e) => {
        // Blob to text transformation ...
        const target = (e.target || e.srcElement) as any;
        const text = target.result;
        childSerialconsole.current.onDataReceived(text);
      });
      reader.readAsText(data);
    }
  }, []);

  const onConnect = React.useCallback(() => {
    debug('SerialConsoleConnector.onConnect(), status = ', status, ', passKeys = ', passKeys);
    if (ws) {
      ws.destroy();
      setStatus(LOADING);
    }

    const options = {
      host,
      path,
      reconnect: false,
      jsonParse: false,
      subprotocols: ['plain.kubevirt.io'],
    };

    setWS(
      new WSFactory(`${getName(vmi)}-serial`, options)
        .onmessage(onDataFromBackend)
        .onopen(setConnected)
        .onclose(onBackendDisconnected)
        .onerror((event) => {
          error('WS error received: ', event);
        }),
    );
  }, [
    status,
    passKeys,
    ws,
    host,
    path,
    vmi,
    onDataFromBackend,
    setConnected,
    onBackendDisconnected,
  ]);

  const onData = React.useCallback(
    (data) => {
      debug(
        'UI terminal component produced data, i.e. a key was pressed, pass it to backend. [',
        data,
        ']',
      );
      // data are resent back from backend so _will_ pass through onDataFromBackend
      ws && ws.send(new Blob([data]));
    },
    [ws],
  );

  return (
    <SerialConsole
      onConnect={onConnect}
      onDisconnect={onBackendDisconnected}
      onResize={onResize}
      onData={onData}
      id="serial-console"
      status={status}
      ref={childSerialconsole}
    />
  );
};
SerialConsoleConnector.displayName = constants.SERIAL_CONSOLE_TYPE; // for child-recognition by AccessConsoles

type SerialConsoleConnectorProps = {
  vmi: VMIKind;
};

export default SerialConsoleConnector;
