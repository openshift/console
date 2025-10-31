/**
 * Shared test utilities for getting-started components
 */

import { screen } from '@testing-library/react';

/**
 * Helper function to assert external link attributes
 * @param element - The link element to check
 * @param href - Expected href value
 */
export const expectExternalLinkAttributes = (element: HTMLElement, href: string) => {
  expect(element).toHaveAttribute('href', href);
  expect(element).toHaveAttribute('target', '_blank');
  expect(element).toHaveAttribute('rel', 'noopener noreferrer');
};

/**
 * Helper function to assert multiple texts are not in the document
 * @param texts - Array of text strings to check
 */
export const expectTextsNotInDocument = (texts: string[]) => {
  texts.forEach((text) => {
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });
};

/**
 * Helper function to clean up SERVER_FLAGS
 * @param flag - The flag name to delete
 */
export const cleanupServerFlag = (flag: string) => {
  delete window.SERVER_FLAGS[flag];
};
