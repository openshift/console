import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router-dom';
import { EventsList } from '@console/internal/components/events';

interface MonitoringEventsProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MonitoringEvents: React.FC<MonitoringEventsProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Events')}</title>
      </Helmet>
      <EventsList {...props} namespace={props.match.params.ns} />
    </>
  );
};

export default MonitoringEvents;
