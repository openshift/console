@crw
Feature: Basic Codeready Workspaces usage
    As a developer user, I should be able to easily access CRW from Openshift Web Console.

    Background:
        Given Red Hat CodeReady Workspaces operator is installed on the cluster in "openshift-workspaces" namespace
        And user has logged in as a basic user
        And user is at developer perspective

    @smoke
    Scenario: CRW is shown in Applications menu in Masthead
        When user click on Application button in Masthead
        Then "CodeReady Workspaces" entry is present in Application menu in Masthead

    @smoke
    Scenario: CRW Dashboard is opened when user clicks on CRW in Applications menu in Masthead
        When user click on Application button in Masthead
        And user click on Codeready Workspaces in Application menu in Masthead
        Then user is redirected to Codeready Workspaces Dashboard
