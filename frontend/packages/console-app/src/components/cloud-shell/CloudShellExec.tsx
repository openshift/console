import * as React from 'react';
import { connect } from 'react-redux';
import { Base64 } from 'js-base64';
import { StatusBox } from '@console/internal/components/utils';
import { connectToFlags, WithFlagsProps } from '@console/internal/reducers/features';
import { impersonateStateToProps } from '@console/internal/reducers/ui';
import { FLAGS } from '@console/shared';
import { WSFactory } from '@console/internal/module/ws-factory';
import { resourceURL } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';
import Terminal from './Terminal';
import TerminalLoadingBox from './TerminalLoadingBox';

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

type Props = {
  container: string;
  podname: string;
  namespace: string;
  shcommand?: string[];
};

type StateProps = {
  impersonate?: {
    subprotocols: string[];
  };
};

type CloudShellExecProps = Props & StateProps & WithFlagsProps;

type CloudShellExecState = {
  open: boolean;
  error: string;
};

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

class CloudShellExec extends React.PureComponent<CloudShellExecProps, CloudShellExecState> {
  private terminal;

  private ws;

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
    };
    this.terminal = React.createRef();
  }

  componentDidMount() {
    this.connect();
  }

  componentWillUnmount() {
    this.ws && this.ws.destroy();
    delete this.ws;
  }

  onData = (data: string): void => {
    this.ws && this.ws.send(`0${Base64.encode(data)}`);
  };

  connect() {
    const { container, podname, namespace, shcommand, flags, impersonate } = this.props;
    const usedClient = flags[FLAGS.OPENSHIFT] ? 'oc' : 'kubectl';
    const cmd = shcommand || ['sh', '-i', '-c', 'TERM=xterm sh'];

    const params = {
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

    if (this.ws) {
      this.ws.destroy();
      const currentTerminal = this.terminal.current;
      currentTerminal && currentTerminal.onConnectionClosed(`connecting to ${container}`);
    }

    const subprotocols = (impersonate?.subprotocols || []).concat('base64.channel.k8s.io');

    let previous;
    this.ws = new WSFactory(`${podname}-terminal`, {
      host: 'auto',
      reconnect: true,
      path: resourceURL(PodModel, params),
      jsonParse: false,
      subprotocols,
    })
      .onmessage((raw) => {
        const currentTerminal = this.terminal.current;
        // error channel
        if (raw[0] === '3') {
          if (previous.includes(NO_SH)) {
            currentTerminal.reset();
            currentTerminal.onConnectionClosed(
              `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${this.props.namespace} exec ${this.props.podname} -ti <command>`,
            );
            this.ws.destroy();
            previous = '';
            return;
          }
        }
        const data = Base64.decode(raw.slice(1));
        currentTerminal && currentTerminal.onDataReceived(data);
        previous = data;
      })
      .onopen(() => {
        const currentTerminal = this.terminal.current;
        currentTerminal && currentTerminal.reset();
        previous = '';
        this.setState({ open: true, error: null });
      })
      .onclose((evt) => {
        if (!evt || evt.wasClean === true) {
          return;
        }
        const error = evt.reason || 'The terminal connection has closed.';
        this.setState({ error });
        this.terminal.current && this.terminal.current.onConnectionClosed(error);
        this.ws.destroy();
      }) // eslint-disable-next-line no-console
      .onerror((evt) => console.error(`WS error?! ${evt}`));
  }

  render() {
    const { open, error } = this.state;
    if (error) {
      return <StatusBox loadError={error} label="OpenShift command line terminal" />;
    }
    if (open) {
      return <Terminal onData={this.onData} ref={this.terminal} />;
    }
    return <TerminalLoadingBox />;
  }
}

export default connect<StateProps>(impersonateStateToProps)(
  connectToFlags<CloudShellExecProps & WithFlagsProps>(FLAGS.OPENSHIFT)(CloudShellExec),
);
