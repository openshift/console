import * as React from 'react';
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import store from '@console/internal/redux';
import { LoadingBox } from '@console/internal/components/utils';
import { WSFactory } from '@console/internal/module/ws-factory';
import { connectToFlags, WithFlagsProps } from '@console/internal//reducers/features';
import { FLAGS } from '@console/shared';
import { Terminal } from './generalTerminal';
import { resourceURL } from '@console/internal//module/k8s';
import { PodModel } from '@console/internal/models';

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

type CloudShellExecProps = WithFlagsProps & {
  message?: string;
  container: string;
  podname: string;
  namespace: string;
  command: string;
};

const CloudShellExec: React.FC<CloudShellExecProps> = ({
  message = null,
  container,
  podname,
  namespace,
  command,
  flags,
}) => {
  const [WsError, setWsError] = React.useState();
  const [open, setOpen] = React.useState(false);
  let terminal: React.RefObject<any> = React.createRef();
  let ws = null;

  React.useEffect(() => {
    const usedClient = flags[FLAGS.OPENSHIFT] ? 'oc' : 'kubectl';
    const params = {
      ns: namespace,
      name: podname,
      path: 'exec',
      queryParams: {
        stdout: '1',
        stdin: '1',
        stderr: '1',
        tty: '1',
        container: container,
        command: command
          ? command
          : ['sh', '-i', '-c', 'TERM=xterm sh'].map((c) => encodeURIComponent(c)).join('&command='),
      },
    };
    if (ws) {
      ws.destroy();
      terminal.current && terminal.current.onConnectionClosed(`connecting to ${container}`);
    }
    const impersonate = store.getState().UI.get('impersonate', {});
    const subprotocols = (impersonate.subprotocols || []).concat('base64.channel.k8s.io');
    let previous;
    ws = new WSFactory(`${name}-terminal`, {
      host: 'auto',
      reconnect: true,
      path: resourceURL(PodModel, params),
      jsonParse: false,
      subprotocols,
    })
      .onmessage((raw) => {
        const { current } = terminal;
        // error channel
        if (raw[0] === '3') {
          if (previous.includes(NO_SH)) {
            current.reset();
            current.onConnectionClosed(
              `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${namespace} exec ${name} -ti <command>`,
            );
            ws.destroy();
            previous = '';
            return;
          }
        }
        const data = Base64.decode(raw.slice(1));
        current && current.onDataReceived(data);
        previous = data;
      })
      .onopen(() => {
        const { current } = terminal;
        current && current.reset();
        previous = '';
        setWsError(null);
        setOpen(true);
      })
      .onclose((evt) => {
        if (evt && evt.wasClean !== true) {
          const error = evt.reason || 'The terminal connection has closed.';
          setWsError(error);
          terminal.current && terminal.current.onConnectionClosed(error);
          ws.destroy();
        }
      }) // eslint-disable-next-line no-console
      .onerror((evt) => setWsError(evt ? evt : 'Some problem occured'));

    return () => {
      console.log('destroying socket');
      ws.destroy();
      ws = null;
    };
  }, []);

  const onData = (data) => {
    ws && ws.send(`0${Base64.encode(data)}`);
  };

  if (WsError) {
    return <div className="text-center cos-error-title">{WsError}</div>;
  }

  if (open) {
    return (
      <div>
        {message}
        <Terminal onData={onData} ref={terminal} />
      </div>
    );
  }
  return <LoadingBox message="Connecting to Terminal" />;
};
export default connectToFlags(FLAGS.OPENSHIFT)(CloudShellExec);
