import React, { PureComponent } from 'react';
import { Icon } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { NodeModel } from '../../models';
import { connectToFlags, FLAGS } from '../../../features';
import { ResourceLink, resourcePathFromModel, Timestamp } from '../utils/okdutils';

export const EventsInnerOverview = connectToFlags(FLAGS.CAN_LIST_NODE)(class EventsInnerOverview extends PureComponent {
  render() {
    const {klass, status, tooltipMsg, obj, lastTimestamp, firstTimestamp, message, source, count, flags, type} = this.props;

    return <div className={`${klass} slide-${status}`}>
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line"></div>
      </div>
      <div className="co-sysevent__box">
        <div className="co-sysevent__header">
          <small>
            <Timestamp className="kubevirt-events__timestamp text-secondary" timestamp={lastTimestamp} />
            <React.Fragment>{' - '}</React.Fragment>
            {count > 1 && <div className="co-sysevent__count text-secondary kubevirt-events__timestamp">
              {count} times in the last <Timestamp timestamp={firstTimestamp} simple={true} omitSuffix={true} />
            </div>}
          </small>
          <div className="co-sysevent__subheader">
            {type === 'Warning' && <Icon type="fa" name="exclamation-circle" className="kubevirt-events__icon--error" />}
            <ResourceLink
              className="co-sysevent__resourcelink"
              kind={obj.kind}
              namespace={obj.namespace}
              name={obj.name}
              title={obj.uid}
            />
          </div>
          <div className="co-sysevent__details">
            <small className="co-sysevent__source">
              Generated from <span>{source.component}</span>
              {source.component === 'kubelet' && <span> on {flags[FLAGS.CAN_LIST_NODE]
                ? <Link to={resourcePathFromModel(NodeModel, source.host)}>{source.host}</Link>
                : <React.Fragment>{source.host}</React.Fragment>}
              </span>}
            </small>
          </div>
        </div>

        <div className="co-sysevent__message text-secondary">
          {message}
        </div>
      </div>
    </div>;
  }
});
