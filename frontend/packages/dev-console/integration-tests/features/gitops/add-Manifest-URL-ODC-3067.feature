Feature: Applications managed by GitOps and Create secret
    User should be able to see list of applications managed by GitOps


Background: 
    Given user is at developer perspective


@regression
Scenario: No GitOps Manifest URLs found
    Given user has installed GitOps Service Operator
    When user clicks on GitOps nav item
    Then user will see the message of No GitOps Manifest URLs found


@regression, @manual
Scenario: Add Manifest URL and No Application groups found message
    Given user has installed the GitOps Service Operator
    When user creates new namespace
    And user goes to Search page
    And user clicks on Resources dropdown
    And user enters Namespaces in the Select Resource field
    And user selects Namespace
    And user clicks on newly created namespace
    And user clicks on YAML tab
    And user adds annotation "app.openshift.io/vcs-uri"
    And user adds the Manifest URL under annotation "app.openshift.io/vcs-uri"
    And user saves the new YAML
    And user reloads the YAML to see the changes
    And user clicks on GitOps nav item
    Then user will see No Application groups found message


@regression, @manual
Scenario: Create Secret
    Given user has installed the GitOps Service Operator
    And user has added the Manifest URL in the namespace annotations
    When user creates the namespace in pattern of "pipelines-{username}-github" 
    And user creates the secret in pattern of "{username}-github-token"
    And user clicks on GitOps nav item
    Then user will see the list GitOps application groupings on the page


@regression, @manual
Scenario: Application Details page for Applications
    Given user is on the GitOps page
    And user can see the Applications on the page
    When user clicks on the application
    Then user can see the Details page for application
    And user can see various environments for that application
    And user can see how many application or workloads are deployed in each environment
    And user can see status of the application or workloads
