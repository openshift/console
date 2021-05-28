**Jira Id:**
<!-- For e.g User story Jira Id : https://issues.redhat.com/browse/ODC-XXX -->
<!-- For Epic related gherkin scripts, e.g Epic Jira Id : https://issues.redhat.com/browse/ODC-XXX -->

**Acceptance Criteria:**
<!-- Briefly describe Acceptance criteria of Epic -->

**Pre-conditions for Epic validation:**
<!-- If any setup required while performing epic validation [which is not mentioned in Back ground section], mention the details -->

**Checks required for approving Epic gherkin scripts PR:**
<!-- Below criteria should met before approving the pr, use [x] -->
- [ ] Add @epic-number to the scenarios or feature file [e.g: @odc-xxx]
- [ ] Add @to-do for automation possible scenarios
- [ ] Add @regression or @smoke based on the importance of the scenario
- [ ] Update the test scenarios count in [Automation status confluence Report](https://docs.jboss.org/display/ODC/Automation+Status+Report)
- [ ] Check for the linter issues by executing `yarn run gherkin-lint` on frontend folder [Skip epic number tags related linter issues]

**Refactoring Gherkin scripts criteria for approving PR:**
<!-- Below criteria should met before approving the pr, use [x] -->
- [ ] Check the linter issues by executing `yarn run gherkin-lint` on frontend folder [Skip epic number tags related linter issues]
- [ ] Update the test cases count in [Automation status confluence Report](https://docs.jboss.org/display/ODC/Automation+Status+Report)
- [ ] Add @un-verified tag which are not verified by ODC QE
