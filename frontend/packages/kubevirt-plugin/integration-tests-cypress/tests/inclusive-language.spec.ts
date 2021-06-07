const offensiveWords = ['master', 'slave', 'whitelist', 'blacklist'];

describe('Test for offensive language', () => {
  it('Looks for offensive words', () => {
    offensiveWords.forEach((word) => {
      cy.exec(
        `git grep --ignore-case ${word} -- ../*\
         ':(exclude)../integration-tests-cypress/tests/inclusive-language.spec.ts'\
         ':(exclude)../src/components/create-vm-wizard/strings/strings-with-offensive-language.ts'\
         ':(exclude)../integration-tests/deploy-kubevirt-gating.sh'\
         ':(exclude)../integration-tests/ci-scripts/setup-storage.sh'`,
        {
          timeout: 10000,
          failOnNonZeroExit: false,
        },
      )
        .its('stdout')
        .should('be.empty');
    });
  });
});
