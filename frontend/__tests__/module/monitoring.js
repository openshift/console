import { alertRuleState } from '../../public/module/monitoring';

describe('alertRuleState', () => {
  it('recognizes valid alert states', () => {
    expect(alertRuleState({alerts: [{state: 'firing'}]})).toEqual('firing');
    expect(alertRuleState({alerts: [{state: 'pending'}]})).toEqual('pending');
    expect(alertRuleState({alerts: [{state: 'firing'}, {state: 'firing'}]})).toEqual('firing');
  });

  it('ignores pending alerts if at least one alert is firing', () => {
    expect(alertRuleState({alerts: [{state: 'pending'}, {state: 'firing'}, {state: 'pending'}]})).toEqual('firing');
  });

  it('returns "inactive" if there are no alerts', () => {
    expect(alertRuleState({alerts: []})).toEqual('inactive');
    expect(alertRuleState({alerts: null})).toEqual('inactive');
    expect(alertRuleState({hi: [{state: 'firing'}]})).toEqual('inactive');
    expect(alertRuleState(null)).toEqual('inactive');
  });

  it('ignores rules without a "state" attribute', () => {
    expect(alertRuleState({alerts: [{}]})).toEqual('inactive');
    expect(alertRuleState({alerts: [{hello: 'hi'}]})).toEqual('inactive');
    expect(alertRuleState({alerts: [null]})).toEqual('inactive');
    expect(alertRuleState({alerts: [{hello: 'hi'}, {state: 'firing'}]})).toEqual('firing');
  });

  it('ignores unrecognized states', () => {
    expect(alertRuleState({alerts: [{state: 'hi'}]})).toEqual('inactive');
    expect(alertRuleState({alerts: [{state: null}]})).toEqual('inactive');
    expect(alertRuleState({alerts: [{state: 'FIRING'}]})).toEqual('inactive');
    expect(alertRuleState({alerts: [{state: 'hi'}, {state: 'pending'}]})).toEqual('pending');
  });
});
