Feature: Helm Chart Installation View
    As a user, I should be able switch between YAML and Form view to install Helm Chart


Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression
Scenario: Grouping of Helm multiple chart versions together in developer catalog
    Given user is at the developer catalog page
    When user checks the Helm Charts checkbox
    And user searches for the 'Nodejs Ex K v0.2.1' helm chart
    Then user will see the one helm chart "Nodejs Ex K v0.2.1"
    And user will see the chart version dropdown at the Install Helm Chart page


@regression, @smoke, @manual
Scenario: Switch from YAML to Form view
    Given user is at the Install Helm Chart page
    When user selects the YAML View
    And user does some changes in the yaml for helm chart
    And user selects the Form view
    And user comes back to YAML view
    Then user will see that the data hasn't lost


@regression, @smoke, @manual
Scenario: Switch from Form to YAML view
    Given user is at the Install Helm Chart page
    When user selects the Form View
    And user will see values and choices are pulled from JSON Schema associated with chart
    And user does some changes in the form for helm chart
    And user selects the YAML view
    And user comes back to Form view
    Then user will see that the data hasn't lost
