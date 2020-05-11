/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import * as React from 'react';
import { Base64 } from 'js-base64';
import { WSFactory } from '@console/internal/module/ws-factory';
import { resourceURL } from '@console/internal/module/k8s/resource';
import { PodModel } from '@console/internal/models';
import { Terminal } from './terminal';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { coFetch } from '@console/internal/co-fetch';

type CloudShellTerminalTestProps = {
  name: string;
  namespace: string;
  running: boolean;
};
type CloudShellTerminalTestState = {
  loading: boolean;
  error: any;
  container: string;
  pod: string;
  command: string[];
  open: boolean;
};

export class CloudShellTerminalTest extends React.PureComponent<
  CloudShellTerminalTestProps,
  CloudShellTerminalTestState
  > {
  private terminal: React.RefObject<any>;

  private onResize: Function;

  private onData: Function;

  private ws: WSFactory;

  constructor(props) {
    super(props);

    this.terminal = React.createRef();

    this.onResize = (rows, cols) => this.onResize_(rows, cols);
    this.onData = (d) => this.onData_(d);

    this.state = {
      loading: true,
      error: undefined,
      container: undefined,
      pod: undefined,
      command: undefined,
      open: false,
    };
  }

  componentDidMount() {
    if (this.props.running === true) {
      coFetch(`/api/terminal/${this.props.namespace}/${this.props.name}/exec/init`, {
        method: 'POST',
        mode: 'cors',
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: JSON.stringify({
          username: "openshift-user",
        }),
      })
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          loading: false,
          container: data.container,
          pod: data.pod,
          command: data.cmd,
        });
      })
      .then(() => this.connect())
      .catch((error) => {
        console.log('>>> got error', error);
        this.setState({
          loading: false,
          error,
        });
      });
    }
  }

  onResize_(rows, cols) {
    if (!rows || !cols) {
      console.log('>>> r:', rows, ', c:', cols);
      return;
    }
    const data = Base64.encode(JSON.stringify({ Height: rows, Width: cols }));
    this.ws && this.ws.send(`4${data}`);
  }

  onData_(data) {
    console.log(">>> onData_")
    this.ws && this.ws.send(`0${Base64.encode(data)}`);
  }

  connect() {
    if (this.ws) {
      this.ws.destroy();
      const { current } = this.terminal;
      current && current.onConnectionClosed(`connecting to ${this.state.container}`);
    }

    const params = {
      ns: this.props.namespace,
      name: this.state.pod,
      path: 'exec',
      queryParams: {
        stdout: '1',
        stdin: '1',
        stderr: '1',
        tty: '1',
        container: this.state.container,
        command: this.state.command.map((c) => encodeURIComponent(c)).join('&command='),
      },
    };
    const subprotocols = [].concat('base64.channel.k8s.io');
    this.ws = new WSFactory(`${this.props.name}-cloudshell-terminal`, {
      host: 'auto',
      reconnect: true,
      path: resourceURL(PodModel, params),
      jsonParse: false,
      subprotocols,
    });
    this.ws
      .onmessage((raw) => {
        const { current } = this.terminal;
        const data = Base64.decode(raw.slice(1));
        current && current.onDataReceived(data);
      })
      .onopen(() => {
        const { current } = this.terminal;
        current && current.reset();
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
      })
      .onerror((evt) => console.error(`WS error?! ${evt}`));
  }

  render() {
    console.log('>>> render, this.props', this.props);
    console.log('>>> render, this.state', this.state);
    if (this.state.error) {
      console.log('>>> loaded with error: ', this.state.error);
      return <div>Something bad happened. {JSON.stringify(this.state.error)}</div>;
    }
    // if (this.props.running === false || this.state.loading || this.state.open === false) {
    //   return <LoadingBox message="Connecting to your OpenShift command line terminal…" />;
    // }

    // return (
    //   // <div className="cloud-shell-term-test" style={{ height: '100%' }}>
    //   // </div>
    // );

    return <div className="co-cloud-shell-terminal-frame">
      {this.props.running === false ? (
        <LoadingBox message="Connecting to your OpenShift command line terminal…" />
      ) : (
        <Terminal onResize={this.onResize} onData={this.onData} ref={this.terminal} />
      )}
    </div>
  }
}
