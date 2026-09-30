import { Priority, priorityFor, vulnPriority } from '../const';

describe('priorityFor', () => {
  it('should resolve every severity the scanner reports', () => {
    Object.values(Priority).forEach((severity) => {
      expect(priorityFor(severity).value).toBe(severity);
    });
  });

  it('should resolve Defcon1, whose display title differs from the value', () => {
    expect(vulnPriority[Priority.Defcon1].title).toBe('Defcon 1');
    expect(priorityFor('Defcon1').value).toBe(Priority.Defcon1);
    expect(priorityFor('Defcon 1').value).toBe(Priority.Defcon1);
  });

  it('should rank severities from most to least urgent', () => {
    const ranked = [
      Priority.Defcon1,
      Priority.Critical,
      Priority.High,
      Priority.Medium,
      Priority.Low,
      Priority.Negligible,
      Priority.Unknown,
    ];
    const indexes = ranked.map((severity) => priorityFor(severity).index);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    expect(new Set(indexes).size).toBe(ranked.length);
  });

  it('should fall back to Unknown for an unrecognized severity', () => {
    expect(priorityFor('not-a-severity').value).toBe(Priority.Unknown);
    expect(priorityFor(undefined).value).toBe(Priority.Unknown);
  });
});
