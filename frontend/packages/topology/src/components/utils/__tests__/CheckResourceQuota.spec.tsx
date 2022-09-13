import { checkQuotaLimit } from '../checkResourceQuota';
import {
  singleResourceQuota,
  multipleResourceQuota,
  noResourceAtQuota,
  twoResourceAtQuota,
} from './mockData';

describe('get resources at quota', () => {
  it('should return one resource at quota', () => {
    const [totalRQatQuota = [], quotaName, quotaKind] = checkQuotaLimit(singleResourceQuota);
    expect(totalRQatQuota.length).toEqual(1);
    expect(quotaName).toEqual('example');
    expect(quotaKind).toEqual('ResourceQuota');
  });

  it('should return one resource at quota out of two resource quotas', () => {
    const [totalRQsatQuota = [], quotaName, quotaKind] = checkQuotaLimit(multipleResourceQuota);
    const totalRQatQuota = totalRQsatQuota.filter((resourceAtQuota) => resourceAtQuota !== 0);
    expect(totalRQatQuota.length).toEqual(1);
    expect(quotaName).toEqual('example');
    expect(quotaKind).toEqual('ResourceQuota');
  });

  it('should return no resource at quota', () => {
    const [totalRQsatQuota = [], quotaName, quotaKind] = checkQuotaLimit(noResourceAtQuota);
    const totalRQatQuota = totalRQsatQuota.filter((resourceAtQuota) => resourceAtQuota !== 0);
    expect(totalRQatQuota.length).toEqual(0);
    expect(quotaName).toEqual('');
    expect(quotaKind).toEqual('');
  });

  it('should return two resource at quota', () => {
    let [totalRQatQuota = []] = checkQuotaLimit(twoResourceAtQuota);
    totalRQatQuota = totalRQatQuota.filter((resourceAtQuota) => resourceAtQuota !== 0);
    expect(totalRQatQuota.length).toEqual(2);
  });
});
