import { Priority } from '../../const';
import { totalCount } from '../image-manifest-vuln';
import { fakeVulnFor } from './bad-pods';

describe('totalCount', () => {
  it('should return 0 if vuln status not present', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    delete vuln.status;
    const tCount = totalCount(vuln);
    expect(tCount).toBe(0);
  });
  it('Total vuln should be 2', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    const tCount = totalCount(vuln);
    expect(tCount).toBe(2);
  });
});
