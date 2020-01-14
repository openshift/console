import * as React from 'react';
import { shallow } from 'enzyme';
import { AccordionContent, AccordionToggle } from '@patternfly/react-core';
import MonitoringMetricsSection from '../MonitoringMetricsSection';

describe('Monitoring Metric Section', () => {
  const metSecProps: React.ComponentProps<typeof MonitoringMetricsSection> = {
    resource: {
      metadata: {
        name: 'workload-name',
        namespace: 'test',
      },
      spec: {},
      status: {},
      kind: 'Deployment',
    },
  };

  it('should render Metric Section for workload of type Deployment', () => {
    const component = shallow(<MonitoringMetricsSection {...metSecProps} />);
    expect(component.find(AccordionContent).exists()).toBe(true);
    expect(component.find(AccordionContent).prop('isExpanded')).toBe(undefined);
  });

  it('should expand & collapse Metric Section accordion', () => {
    const component = shallow(<MonitoringMetricsSection {...metSecProps} />);
    component.find(AccordionToggle).simulate('click');
    expect(component.find(AccordionToggle).prop('isExpanded')).toBe(true);
    expect(component.find(AccordionContent).prop('isHidden')).toBe(false);
    component.find(AccordionToggle).simulate('click');
    expect(component.find(AccordionToggle).prop('isExpanded')).toBe(false);
    expect(component.find(AccordionContent).prop('isHidden')).toBe(true);
  });
});
