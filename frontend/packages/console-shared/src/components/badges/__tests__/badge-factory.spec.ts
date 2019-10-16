import { BadgeType, getBadgeFromType } from '../badge-factory';
import DevPreviewBadge from '../DevPreviewBadge';
import TechPreviewBadge from '../TechPreviewBadge';

describe('Test Badge Type Factory', () => {
  it('expect to always get back a badge using an official type', () => {
    Object.values(BadgeType).forEach((badgeType) => {
      expect(getBadgeFromType(badgeType)).not.toEqual(null);
    });
  });

  it('expect DevPreviewBadge from BadgeType.DEV', () => {
    expect(getBadgeFromType(BadgeType.DEV).type).toEqual(DevPreviewBadge);
  });

  it('expect TechPreviewBadge from BadgeType.TECH', () => {
    expect(getBadgeFromType(BadgeType.TECH).type).toEqual(TechPreviewBadge);
  });
});
