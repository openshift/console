import * as React from 'react';
import { Map } from 'immutable';
import * as redux from 'react-redux';
import { shallow } from 'enzyme';
import { Table, TableHeader, TableBody } from '@patternfly/react-table';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';
import { MonitoringAlerts } from '../MonitoringAlerts';

describe('MonitoringAlerts', () => {
  const monitoringAlertsProps: React.ComponentProps<typeof MonitoringAlerts> = {
    match: {
      params: {
        ns: 'monitoring-test',
      },
      isExact: true,
      path: '',
      url: '',
    },
    rules: {
      data: [],
      loaded: true,
      loadError: '',
    },
    filters: Map({}),
    listSorts: Map({}),
  };
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const spySelector = jest.spyOn(redux, 'useSelector');
  spySelector.mockReturnValue({ monitoring: { devRules: [] } });
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const spyDispatch = jest.spyOn(redux, 'useDispatch');
  spyDispatch.mockReturnValue(() => {});
  it('should render monitoring alerts', () => {
    const wrapper = shallow(<MonitoringAlerts {...monitoringAlertsProps} />);
    expect(wrapper.find(FilterToolbar).exists()).toBe(true);
    expect(wrapper.find(Table).exists()).toBe(true);
    expect(wrapper.find(TableHeader).exists()).toBe(true);
    expect(wrapper.find(TableBody).exists()).toBe(true);
  });
});
