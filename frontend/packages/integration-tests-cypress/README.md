#### Getting Started
- [What is Cypress?](https://www.youtube.com/watch?v=dr10Z-HpsCQ) (video)
- [Cypress in a Nutshell](https://www.youtube.com/watch?v=LcGHiFnBh3Y) (video)

#### Best Practices
- Each it() should be its own atomic test (run independently of other tests).  Each it() should likely start with
cy.visit() or nav to page
- We are switching over our test ids from `< ... data-test-id=".."/>` to using the Cypress preferred 
`< ... data-test=".."/>`.  This allows us to better take advantage of certain Cypress tooling, like the 
[Selector Playground](https://docs.cypress.io/guides/core-concepts/test-runner.html#Selector-Playground) 
- Use [Cypress's Best Practices for Selecting Elements](https://docs.cypress.io/guides/references/best-practices.html)

#### Migrating Protractor tests to Cypress

When migrating a test suite from Protractor to Cypress, the following steps are recommended:
1. Create the new test suite in Cypress
2. If you need to create a new test id use the `data-test` attribute and the `cy.byTestID()` helper method.
If you need to access the legacy `data-test-id` attribute, use the `cy.byLegacyTestID()` helper method.
3. Remove test suite from Protractor

#### Directory Structure
```
frontend/packages/integration-tests-cypress/
├── support    <--- add commands to Cypress 'cy.' global, other support configurations
│   ├── index.ts
│   ├── nav.ts
│   ├── project.ts
│   ├── README.md
│   └── selectors.ts
├── fixtures                <--- mock data
│   └── example.json
├── plugins
│   └── index.js            <--- webpack-preprocessor, enviornment variables, baseUrl, custom tasks
├── tests                   <--- test suites
│   ├── crud
│   │   └── namespace-crud.spec.ts
│   └── monitoring
│       └── monitoring.spec.ts
└── views                   <--- helper objects containing assertions and commands
    ├── details-page.ts
    ├── list-page.ts
    ├── form.ts    
    └── modal.ts
```

#### Additional Resources
- [Assertions](https://docs.cypress.io/guides/references/assertions.html#Chai)
- [Debugging](https://docs.cypress.io/guides/guides/debugging.html#Using-debugger)
- [Cypress.io docs](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Cypress-Can-Be-Simple-Sometimes)
- [Cypress.io Recipes](https://docs.cypress.io/examples/examples/recipes.html#Fundamentals)

