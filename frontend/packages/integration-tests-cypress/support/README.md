# Cypress Custom Commands

Cypress comes with its own API for creating custom commands.  This allows adding custom commands to the 
Cypress global `cy` variable.

Ex: `cy.createTestProject('test-qbvzv')`

Custom commands work well when you’re needing to describe behavior that’s desirable across all of your tests. 
Examples would be a cy.setup() or cy.login() or extending your application’s behavior like cy.get('.dropdown').dropdown('Apples'). 
These are specific to your application and can be used everywhere.

However, this pattern can be used and abused. Let’s not forget - writing Cypress tests is JavaScript, and 
it’s often more efficient to write a function for repeatable behavior that’s specific to only a single spec file.

Please follow [Cypress Best Practices for Custom Commands](https://docs.cypress.io/api/cypress-api/custom-commands.html#Best-Practices)
