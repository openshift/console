import { getBestMatch, groupQuickStartsByName } from '../useQuickStarts';
import {
  quickStartSample,
  anotherQuickStartSample,
  translatedQuickStarts,
} from './useQuickStarts.data';

describe('groupConsoleSamplesByName', () => {
  it('should create a single group for one sample without localization labels', () => {
    const actual = groupQuickStartsByName([quickStartSample]);
    expect(actual).toEqual({
      'quickstart-sample': [quickStartSample],
    });
  });

  it('should create a two groups for two different samples without localization labels', () => {
    const actual = groupQuickStartsByName([quickStartSample, anotherQuickStartSample]);
    expect(actual).toEqual({
      'quickstart-sample': [quickStartSample],
      'another-quickstart-sample': [anotherQuickStartSample],
    });
  });

  it('should group the translated samples correct', () => {
    const actual = groupQuickStartsByName(translatedQuickStarts);

    expect(actual).toEqual({ 'quickstart-sample': translatedQuickStarts });
  });
});

describe('getBestMatch', () => {
  it('should return null for null', () => {
    expect(getBestMatch(null, '')).toBe(null);
  });

  it('should return null for an empty array', () => {
    expect(getBestMatch([], 'en')).toBe(null);
  });

  it('should return the sample with an equal language and country', () => {
    // neighter language or country is defined
    expect(getBestMatch(translatedQuickStarts, '')).toEqual(translatedQuickStarts[0]);
    // default language is preferred, no country
    expect(getBestMatch(translatedQuickStarts, 'en')).toEqual(translatedQuickStarts[0]);
    // non default language and country
    expect(getBestMatch(translatedQuickStarts, 'fr-CA')).toEqual(translatedQuickStarts[3]);
    // lowercase input
    expect(getBestMatch(translatedQuickStarts, 'fr-ca')).toEqual(translatedQuickStarts[3]);
    // uppercase input
    expect(getBestMatch(translatedQuickStarts, 'FR-CA')).toEqual(translatedQuickStarts[3]);
    // language defined, but not english, no country
    expect(getBestMatch(translatedQuickStarts, 'fr')).toEqual(translatedQuickStarts[4]);
  });

  it('should return the sample with the same language, prefer no country', () => {
    expect(getBestMatch(translatedQuickStarts, 'fr-MC')).toEqual(translatedQuickStarts[4]);
  });

  it('should return the sample with the same language, prefer any country', () => {
    expect(getBestMatch(translatedQuickStarts, 'DE-CH')).toEqual(translatedQuickStarts[5]);
  });

  it('should return the fallback language with the same country', () => {
    expect(getBestMatch(translatedQuickStarts, 'NA-CA')).toEqual(translatedQuickStarts[2]);
  });

  it('should return the fallback language with no country', () => {
    expect(getBestMatch(translatedQuickStarts, 'NA-NA')).toEqual(translatedQuickStarts[0]);
  });

  it('should return the fallback language with any country', () => {
    expect(getBestMatch(translatedQuickStarts.slice(1), 'NA-NA')).toEqual(translatedQuickStarts[1]);
  });
});
