import { getBestMatch, groupConsoleSamplesByName } from '../samples';
import {
  gitImportSample,
  containerImportSample,
  translatedSamples,
  translatedGitImportSamples,
  translatedContainerImportSamples,
} from './samples.data';

describe('groupConsoleSamplesByName', () => {
  it('should create a single group for one sample without localization labels', () => {
    const actual = groupConsoleSamplesByName([gitImportSample]);
    expect(actual).toEqual({
      'nodeinfo-git-sample': [gitImportSample],
    });
  });

  it('should create a two groups for two different samples without localization labels', () => {
    const actual = groupConsoleSamplesByName([gitImportSample, containerImportSample]);
    expect(actual).toEqual({
      'nodeinfo-git-sample': [gitImportSample],
      'nodeinfo-container-sample': [containerImportSample],
    });
  });

  it('should group the translated samples correct', () => {
    const actual = groupConsoleSamplesByName(translatedSamples);

    expect(Object.keys(actual)).toEqual(['nodeinfo-git-sample', 'nodeinfo-container-sample']);

    const groupedGitSamples = actual['nodeinfo-git-sample'];
    const groupedContainerSamples = actual['nodeinfo-container-sample'];

    expect(groupedGitSamples).toEqual(translatedGitImportSamples);
    expect(groupedContainerSamples).toEqual(translatedContainerImportSamples);
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
    expect(getBestMatch(translatedGitImportSamples, '')).toEqual(translatedGitImportSamples[0]);
    // default language is preferred, no country
    expect(getBestMatch(translatedGitImportSamples, 'en')).toEqual(translatedGitImportSamples[0]);
    // non default language and country
    expect(getBestMatch(translatedGitImportSamples, 'fr-CA')).toEqual(
      translatedGitImportSamples[3],
    );
    // lowercase input
    expect(getBestMatch(translatedGitImportSamples, 'fr-ca')).toEqual(
      translatedGitImportSamples[3],
    );
    // uppercase input
    expect(getBestMatch(translatedGitImportSamples, 'FR-CA')).toEqual(
      translatedGitImportSamples[3],
    );
    // language defined, but not english, no country
    expect(getBestMatch(translatedGitImportSamples, 'fr')).toEqual(translatedGitImportSamples[4]);
  });

  it('should return the sample with the same language, prefer no country', () => {
    expect(getBestMatch(translatedGitImportSamples, 'fr-MC')).toEqual(
      translatedGitImportSamples[4],
    );
  });

  it('should return the sample with the same language, prefer any country', () => {
    expect(getBestMatch(translatedGitImportSamples, 'DE-CH')).toEqual(
      translatedGitImportSamples[5],
    );
  });

  it('should return the fallback language with the same country', () => {
    expect(getBestMatch(translatedGitImportSamples, 'NA-CA')).toEqual(
      translatedGitImportSamples[2],
    );
  });

  it('should return the fallback language with no country', () => {
    expect(getBestMatch(translatedGitImportSamples, 'NA-NA')).toEqual(
      translatedGitImportSamples[0],
    );
  });

  it('should return the fallback language with any country', () => {
    expect(getBestMatch(translatedGitImportSamples.slice(1), 'NA-NA')).toEqual(
      translatedGitImportSamples[1],
    );
  });
});
