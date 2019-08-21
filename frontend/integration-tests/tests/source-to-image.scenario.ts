import { checkLogs, checkErrors } from '../protractor.conf';
import * as sourceToImageView from '../views/source-to-image.view';

describe('Source-to-Image', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  describe('Image stream page', () => {
    it('has Create Application button for builder image', async() => {
      await sourceToImageView.visitOpenShiftImageStream('nodejs');
      expect(sourceToImageView.createApplicationButton.isPresent()).toBe(true);
    });

    it('does not have Create Application button for non-builder image', async() => {
      await sourceToImageView.visitOpenShiftImageStream('jenkins');
      expect(sourceToImageView.createApplicationButton.isPresent()).toBe(false);
    });
  });
});
