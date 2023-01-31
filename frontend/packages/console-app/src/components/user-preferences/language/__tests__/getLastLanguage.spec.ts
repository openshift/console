import { getLastLanguage } from '../getLastLanguage';

describe('getLastLanguage', () => {
  it('Should not return null value or undefined', () => {
    const lastLng = getLastLanguage();

    expect(lastLng).not.toBeNull();
    expect(lastLng).toBeDefined();

    // Extracts 'en' in 'en-US' using 'substring' method, because the 'navigator.language' returns US ISO language code -'en-US' in testing env.
    expect(lastLng.substring(0, 2)).toHaveLength(2);
  });
});
