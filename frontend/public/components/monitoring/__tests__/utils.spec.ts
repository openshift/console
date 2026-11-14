import { getAlertsAndRules } from '../utils';

describe('getAlertsAndRules', () => {
  it('treats an alerting rule without `alerts` as having none', () => {
    // vmalert omits `alerts` on inactive rules; Prometheus sends [].
    const data = {
      groups: [
        {
          file: 'f',
          name: 'g',
          rules: [
            { type: 'alerting', name: 'Inactive', query: 'up == 0', duration: 0, labels: {} },
            {
              type: 'alerting',
              name: 'Firing',
              query: 'vector(1)',
              duration: 0,
              labels: { severity: 'warning' },
              alerts: [{ labels: { alertname: 'Firing' }, state: 'firing' }],
            },
            { type: 'recording', name: 'rec', query: 'sum(up)' },
          ],
        },
      ],
    } as any;

    const { alerts, rules } = getAlertsAndRules(data);

    expect(rules.map((r) => r.name)).toEqual(['Inactive', 'Firing']);
    expect(rules[0].alerts).toEqual([]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].labels).toEqual({ alertname: 'Firing', severity: 'warning' });
  });
});
