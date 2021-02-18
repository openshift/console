import * as React from 'react';
import * as _ from 'lodash-es';
import { Alert, AlertVariant, Button, List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <Alert
      isInline
      variant={variant}
      className="co-alert"
      title={
        <>
          {t('public~There is {{count}} {{variant}} alert.', { count: alertCount, variant })}
          <Button type="button" onClick={() => setExpanded(!expanded)} variant="link">
            {expanded ? t('public~Hide details') : t('public~Show details')}
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
