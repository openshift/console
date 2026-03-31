#### Getting Started
- [What is Cypress?](https://www.youtube.com/watch?v=dr10Z-HpsCQ) (video)
- [Cypress in a Nutshell](https://www.youtube.com/watch?v=LcGHiFnBh3Y) (video)

#### Running Tests in Parallel
The test suite supports parallelization using the `cypress-split` plugin to reduce execution time from ~45 minutes to ~12 minutes with 4 parallel processes.

**Quick Start:**
```bash
# Run with default 4 parallel processes
./run-parallel.sh

# Run with custom number of parallel processes
SPLIT_TOTAL=8 ./run-parallel.sh

# Validate setup
./validate-parallel.sh
```

**For complete documentation, see:**
- **[Quick Start Guide](../../../CYPRESS_PARALLEL_QUICKSTART.md)** - Quick commands and examples
- **[Parallelization Guide](./PARALLELIZATION.md)** - Detailed local development guide
- **[Prow CI Guide](./PROW_PARALLEL.md)** - OpenShift Prow CI integration
- **[Example Prow Job](./prow-parallel-job.example.yaml)** - Sample CI configuration
- **[Example GitHub Actions](./cypress-parallel.example.yml)** - Sample GHA workflow

#### Best Practices
- Each it() should be its own atomic test (run independently of other tests).  Each it() should likely start with
cy.visit() or nav to page
- We are switching over our test ids from `< ... data-test-id=".."/>` to using the Cypress preferred
`< ... data-test=".."/>`.  This allows us to better take advantage of certain Cypress tooling, like the
[Selector Playground](https://docs.cypress.io/guides/core-concepts/test-runner.html#Selector-Playground)
- Use [Cypress's Best Practices for Selecting Elements](https://docs.cypress.io/guides/references/best-practices.html)

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
│   │   └── namespace-crud.cy.ts
│   └── monitoring
│       └── monitoring.cy.ts
└── views                   <--- helper objects containing assertions and commands
    ├── details-page.ts
    ├── list-page.ts
    ├── form.ts
    └── modal.ts
```

#### Additional Resources
- [Test Parallelization Guide](./PARALLELIZATION.md) - Running tests in parallel for faster execution
- [Assertions](https://docs.cypress.io/guides/references/assertions.html#Chai)
- [Debugging](https://docs.cypress.io/guides/guides/debugging.html#Using-debugger)
- [Cypress.io docs](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Cypress-Can-Be-Simple-Sometimes)
- [Cypress.io Recipes](https://docs.cypress.io/examples/examples/recipes.html#Fundamentals)

