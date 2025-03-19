import { configure, render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import { EventSinkSourceSection } from '../knative-resource-tab-sections';
import { eventSinkKamelet } from './__mocks__/event-sink-data';

configure({ testIdAttribute: 'data-test' });

describe('EventSinkSourceSection', () => {
  it('should show message no output resources foung if none exists', () => {
    const mockEventSink = _.omit(eventSinkKamelet, 'spec.source');
    render(<EventSinkSourceSection resource={mockEventSink} />);
    screen.getByTestId('event-sink-text');
    expect(screen.queryByTestId('event-sink-sb-res')).toBeNull();
    expect(screen.queryByTestId('event-sink-target-uri')).toBeNull();
  });

  it('should show ResourceLink as output resource if source is ref', () => {
    render(<EventSinkSourceSection resource={eventSinkKamelet} />);
    screen.getByTestId('event-sink-sb-res');
    expect(screen.queryByTestId('event-sink-text')).toBeNull();
    expect(screen.queryByTestId('event-sink-target-uri')).toBeNull();
  });

  it('should show ExternalLink as output resource if source is uri', () => {
    const mockEventSink = _.omit(eventSinkKamelet, 'spec.source.ref');
    mockEventSink.spec.source.uri = 'http://abc.com';
    render(<EventSinkSourceSection resource={mockEventSink} />);
    screen.getByTestId('event-sink-target-uri');
    expect(screen.queryByTestId('event-sink-text')).toBeNull();
    expect(screen.queryByTestId('event-sink-sb-res')).toBeNull();
  });
});
