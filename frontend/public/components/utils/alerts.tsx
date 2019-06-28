import * as React from 'react';
import * as _ from 'lodash-es';
import { Alert, AlertVariant, List, ListItem } from '@patternfly/react-core';

export const ExpandableAlert: React.FC<CustomAlertProps> = ({alerts, variant}) => {
  const alertCount = alerts.length;
  const [expanded, setExpanded] = React.useState(false);
  const alertContent = alertCount > 1 ? <List>{_.map(alerts, (error, i) => <ListItem key={i}>{error}</ListItem>)}</List> : alerts;

  return <Alert
    isInline
    variant={variant}
    className="co-expandable-alert"
    title={<React.Fragment>{`There are ${alertCount} ${variant} alerts.`}<button type="button" className="btn btn-link" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'} Details</button></React.Fragment>}
  >
    {expanded && alertContent}
  </Alert>;
};

type CustomAlertProps = {
  alerts: React.ReactNode[];
  variant: AlertVariant;
};
