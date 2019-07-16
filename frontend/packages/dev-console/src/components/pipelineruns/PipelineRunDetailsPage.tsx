import * as React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { PodLogs } from '@console/internal/components/pod-logs';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory, StatusIconAndText, Firehose } from '@console/internal/components/utils';
import { viewYamlComponent } from '@console/internal/components//utils/horizontal-nav';
import { PipelineRunDetails } from './PipelineRunDetails';
import { pipelineRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import { PipelineTaskStatus } from './PipelineTaskStatus';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    pages={[
      navFactory.details(PipelineRunDetails),
      navFactory.editYaml(viewYamlComponent),
      navFactory.logs(PipelineRunLogs),
    ]}
  />
);
interface Props {
  obj: any;
}
interface States {
  activeItem: any;
}
class PipelineRunLogs extends React.Component<Props, States> {
  constructor(props) {
    super(props);
    this.state = { activeItem: null };
  }

  componentDidMount() {
    const { obj } = this.props;
    const taskRuns =
      obj.status && obj.status && obj.status.taskRuns ? Object.keys(obj.status.taskRuns) : [];
    taskRuns.length > 0 && this.setState({ activeItem: Object.keys(obj.status.taskRuns)[0] });
  }

  onNavSelect = (item) => {
    this.setState({
      activeItem: item.itemId,
    });
  };

  render() {
    const { obj } = this.props;
    const { activeItem } = this.state;
    const taskRuns =
      obj.status && obj.status && obj.status.taskRuns ? Object.keys(obj.status.taskRuns) : [];
    const taskCount = taskRuns.length;
    console.log(
      'pppppppresources',
      obj.status.taskRuns[activeItem] &&
        obj.status.taskRuns[activeItem].status &&
        obj.status.taskRuns[activeItem].status.podName
        ? obj.status.taskRuns[activeItem].status.podName
        : 'garbar',
    );
    const resources = taskCount > 0 && [
      {
        name:
          obj.status.taskRuns[activeItem] &&
          obj.status.taskRuns[activeItem].status &&
          obj.status.taskRuns[activeItem].status.podName
            ? obj.status.taskRuns[activeItem].status.podName
            : 'garbar',
        kind: 'Pod',
        namespace: obj.metadata.namespace,
        prop: `obj`,
        isList: false,
      },
    ];
    console.log('Firehose resource', resources);
    return (
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-sm-1">Pipeline Run Status</div>
          <div className="col-sm-3">
            <StatusIconAndText status={pipelineRunFilterReducer(obj)} />
          </div>
          <div className="col-sm-1">Task Status</div>
          <div className="col-sm-3">
            <PipelineTaskStatus pipelinerun={obj} />
          </div>
        </div>
        <div className="row" style={{ marginTop: '40px', position: 'relative', bottom: '10px' }}>
          <div className="col-sm-3">
            {taskCount > 0 ? (
              <Nav onSelect={this.onNavSelect}>
                <NavList>
                  {taskRuns.map((a) => {
                    return (
                      <NavItem key={a} itemId={a} isActive={activeItem === a}>
                        {a}
                      </NavItem>
                    );
                  })}
                </NavList>
              </Nav>
            ) : (
              <div>No Task Runs Found</div>
            )}
          </div>
          <div
            className="col-sm-9"
            style={{
              background: 'black',
              color: 'white',
              padding: '10px',
              height: '100%',
              position: 'relative',
              bottom: '10px',
            }}
          >
            {activeItem ? (
              <Firehose resources={resources}>
                <FetchPRPod />
              </Firehose>
            ) : obj.status &&
              obj.status.conditions &&
              obj.status.conditions.length > 0 &&
              obj.status.conditions[0].message ? (
              obj.status.conditions[0].message
            ) : (
              <>No Logs Found</>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const FetchPRPod = (props) => {
  console.log('PRPods', props);
  return props.obj && props.obj.data?<PodLogs obj={props.obj.data} />:<div>No logs Found</div>;
};
export default PipelineRunDetailsPage;
