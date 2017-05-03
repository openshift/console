import React from 'react';
import { Link } from 'react-router';

import { containerLinuxUpdateOperator } from '../utils';
import { SafetyFirst } from '../safety-first';

const Status = ({status}) => {
  return <div className="co-cluster-updates__details">
    <dl className="co-cluster-updates__detail">
      <dt>Status</dt>
      <dd>{status}</dd>
    </dl>
  </div>;
};

/** This component can show as two sections
"Download Completed" section:
When a node enters 'Downloading', 'Verifying", 'Finalizing', light up (i.e. spinner shows up and showing "0 of [NUMBER OF NODES NEED UPDATE]") the "Download Completed" section.
Only update/add up the node count for nodes in "Updated_Need_Reboot" state.

"Update Completed" section:
When a node enters 'Rebooting', light up (i.e. spinner shows up and showing "0 of [NUMBER OF NODES NEED UPDATE]") the "Update Completed" section.
Only update/add up the node count for up-to-date nodes.
**/
const Breakdown = ({iconClass, text, count, total, textClass}) => {
  return <div className="co-cluster-updates__operator-ts-component">
    <div className="co-cluster-updates__operator-ts-step">
      <div className="co-cluster-updates__operator-icon"><span className={iconClass}></span></div>
      <div className="co-cluster-updates__operator-text">
        <div className={textClass}>
          {text}
        </div>
        <div>
          <Link to="nodes">{count} of {total}</Link>
        </div>
      </div>

    </div>
  </div>;
};

const Details = ({nodeListUpdateStatus}) => {
  const totalNodes = nodeListUpdateStatus.count;
  const upgradeCount = nodeListUpdateStatus.upgradeCount;

  return <div className="co-cluster-updates__operator-component">
    <div className="co-cluster-updates__operator-step">
      <div className="co-cluster-updates__operator-text">
        {nodeListUpdateStatus.isSoftwareUpgarding ? <span><span className="co-cluster-updates__operator-subheader">Updated Software is available</span> <span className="text-muted">({upgradeCount} nodes need updating)</span></span> : <span>Container Linux &#10141; Latest Update</span>}
      </div>
    </div>
    {(nodeListUpdateStatus.downloading.length > 0 || nodeListUpdateStatus.downloadCompleted.length > 0) &&
      <Breakdown text="Download Completed"
        count={nodeListUpdateStatus.downloadCompleted.length}
        iconClass={containerLinuxUpdateOperator.getDownloadCompletedIconClass(nodeListUpdateStatus)}
        total={upgradeCount} />
    }
    {(nodeListUpdateStatus.downloading.length > 0 || nodeListUpdateStatus.rebooting.length > 0) &&
      <Breakdown text="Update Completed"
        iconClass={containerLinuxUpdateOperator.getUpdateCompletedIconClass(nodeListUpdateStatus)}
        count={nodeListUpdateStatus.upToDate.length}
        textClass={nodeListUpdateStatus.downloading.length ? 'co-cl-operator--pending' : ''}
        total={upgradeCount} />
    }
    {nodeListUpdateStatus.upToDate.length === totalNodes &&
      <Breakdown text="Container Linux is up to date"
        iconClass="fa fa-check-circle co-cl-operator--up-to-date"
        count={nodeListUpdateStatus.upToDate.length}
        total={totalNodes} />
    }
  </div>;
};

export class ContainerLinuxUpdateDetails extends SafetyFirst {
  constructor(props) {
    super(props);
    this._toggleExpand = this._toggleExpand.bind(this);
    this.state = {
      expanded: false
    };
  }

  _toggleExpand(event) {
    event.preventDefault();
    this.setState({
      expanded: !this.state.expanded
    });
    event.target.blur();
  }

  render() {
    const {nodeListUpdateStatus, isOperatorInstalled} = this.props;
    return <div>
      { isOperatorInstalled && <div className="co-cluster-updates__component">
        <div className="co-cluster-updates__heading">
          <div className="co-cluster-updates__heading--name-wrapper">
            <span className="co-cluster-updates__heading--name">Container Linux</span>
          </div>
          { this.state.expanded ||
            <div className="co-cluster-updates__heading--updates">
              <div className="co-cluster-updates__heading--updates">{nodeListUpdateStatus.overallState}</div>
            </div>
          }
          <a className="co-cluster-updates__toggle" onClick={this._toggleExpand}>{this.state.expanded ? 'Collapse' : 'Expand'}</a>
        </div>
        { this.state.expanded && <div>
          <Status status={nodeListUpdateStatus.overallState} />
          <div className="co-cluster-updates__operator">
            <Details nodeListUpdateStatus={nodeListUpdateStatus} />
          </div>
        </div> }
      </div> }
    </div>;
  }
}
