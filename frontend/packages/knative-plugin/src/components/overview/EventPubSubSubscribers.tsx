import * as React from 'react';
import { Grid, GridItem, List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading, ResourceLink } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { Subscriber } from '../../topology/topology-types';
import EventPubSubExpandButton from './EventPubSubExpandButton';
import FilterTable from './FilterTable';

import './EventPubSubSubscribers.scss';

type EventPubSubSubscribersProps = {
  title?: string;
  subscribers?: Subscriber[];
};

const EventPubSubSubscribers: React.FC<EventPubSubSubscribersProps> = ({
  subscribers,
  title = 'Subscribers',
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState('');

  return (
    <>
      <SidebarSectionHeading text={title} />
      {subscribers?.length && subscribers?.length > 0 ? (
        <List isPlain isBordered className="kn-event-subscriber-list">
          {subscribers?.map((sub) => (
            <ListItem className="kn-event-subscriber-list-item" key={sub.name}>
              <ResourceLink kind={referenceFor(sub)} name={sub.name} namespace={sub.namespace} />
              {sub.data.length > 0 &&
                sub.data.map((r) => {
                  const onClick = () => {
                    if ((expanded.length > 0 && expanded !== r.name) || expanded.length === 0) {
                      setExpanded(r.name);
                    } else {
                      setExpanded('');
                    }
                  };

                  return (
                    <React.Fragment key={r.name}>
                      <Grid className="kn-event-subscriber-list__relationship">
                        <GridItem span={9}>
                          <ResourceLink
                            kind={referenceFor(r)}
                            name={r.name}
                            namespace={r.namespace}
                          />
                        </GridItem>
                        {r?.filters && r?.filters.length > 0 && (
                          <GridItem span={3}>
                            <span className="pf-v6-u-text-align-right">
                              <EventPubSubExpandButton
                                rowSelected={expanded.length > 0 && r.name === expanded}
                                onClick={onClick}
                              />
                            </span>
                          </GridItem>
                        )}
                      </Grid>
                      {r?.filters && expanded === r.name && (
                        <Grid className="kn-event-subscriber-list__relationship-table">
                          <GridItem>
                            <FilterTable filters={r?.filters} paddingLeft />
                          </GridItem>
                        </Grid>
                      )}
                    </React.Fragment>
                  );
                })}
            </ListItem>
          ))}
        </List>
      ) : (
        <span className="pf-v6-u-text-color-subtle">
          {t('knative-plugin~No Subscribers found for this resource.')}
        </span>
      )}
    </>
  );
};

export default EventPubSubSubscribers;
