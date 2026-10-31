# Definition of Verified

In order for the OCP Console team member to verify the Pull Request change, the steps below must be done serially: complete each step before starting the next. Do not treat them as parallel or interchangeable workstreams.

## Pull Request Reviewer Responsibilities

1. Readiness assessment  
   * Verify that the linked Jira issue meets the Definition of Ready before starting the review  
2. Code review  
   * Assessing only code changes  
   * Focus area:  
     * Code changes  
     * Test coverage \- unit & e2e  
       1. Adding new tests cases that cover the new functionality  
       2. Update existing test cases if there is a functional change  
   * Provides `lgtm` label
3. Functional verification  
   * Manual testing of the change based on the provided Test Cases  
   * Automated CI testing is green  
   * Provides `verified` label
