import * as React from 'react';
import * as _ from 'lodash-es';
import { Alert, AlertVariant, Button, List, ListItem } from '@patternfly/react-core';

export const ExpandableAlert: React.FC<CustomAlertProps> = ({ alerts, variant }) => {
  const alertCount = alerts.length;
  const [expanded, setExpanded] = React.useState(false);
  const alertContent =
    alertCount > 1 ? (
      <List>
        {_.map(alerts, (error, i) => (
          <ListItem key={i}>{error}</ListItem>
        ))}
      </List>
    ) : (
      alerts
    );

  return (
    <Alert
      isInline
      variant={variant}
      className="co-alert"
      title={
        <>
          {`There are ${alertCount} ${variant} alerts.`}
          <Button type="button" onClick={() => setExpanded(!expanded)} variant="link">
            {expanded ? 'Hide' : 'Show'} Details
          </Button>
        </>
      }
    >
      {expanded && alertContent}
    </Alert>
  );
};

type CustomAlertProps = {
  alerts: React.ReactNode[];
  variant: AlertVariant;
};
