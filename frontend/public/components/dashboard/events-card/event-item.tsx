import * as React from 'react';
import { Icon } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { connectToFlags } from '../../../reducers/features';
import { FLAGS } from '../../../const';
import { Timestamp, ResourceLink, resourcePathFromModel } from '../../utils';
import { NodeModel } from '../../../models';
import { EventComponentProps } from '../../utils/event-stream';
import { categoryFilter } from '../../events';

const EventItem_: React.FC<EventItemProps> = ({ event, flags }) => {
  const { count, firstTimestamp, lastTimestamp, involvedObject: obj, source, message } = event;
  const isError = categoryFilter('error', event);
  return (
    <div className="co-events-card__item">
      <small>
        <Timestamp simple className="co-events-card__item-timestamp text-secondary" timestamp={lastTimestamp} />
        {count > 1 && <div className="text-secondary co-events-card__item-timestamp">
          &nbsp;- {count} times in the last <Timestamp timestamp={firstTimestamp} simple={true} omitSuffix={true} />
        </div>}
      </small>
      <div className="co-events-card__item-subheader">
        {isError && <Icon type="fa" name="exclamation-circle" className="co-events-card__item-icon--error" />}
        <ResourceLink
          className="co-events-card__item-resourcelink"
          kind={obj.kind}
          namespace={obj.namespace}
          name={obj.name}
          title={obj.uid}
        />
      </div>
      <small className="co-events-card__item-source">
        Generated from <span>{source.component}</span>
        {source.component === 'kubelet' && <span> on {flags[FLAGS.CAN_LIST_NODE]
          ? <Link to={resourcePathFromModel(NodeModel, source.host)}>{source.host}</Link>
          : <React.Fragment>{source.host}</React.Fragment>}
        </span>}
      </small>

      <div className="co-events-card__item-message text-secondary">
        {message}
      </div>
    </div>
  );
};

export const EventItem = React.memo(connectToFlags(FLAGS.CAN_LIST_NODE)(EventItem_));

type EventItemProps = EventComponentProps & {
  flags: {[FLAGS.CAN_LIST_NODE]: boolean};
};
