Feature: Filter for Alert state and Severity
	User should be able to filter out alerts as per Alert State and Severity


Background:
    Given user logged into the openshift application
    And user is at the developer perspective


@regression, @smoke
Scenario: Filters on the Alerts page
    Given user is on the Alerts tab
    Then user will see on the Filters option on the Alerts page


@regression, @smoke
Scenario: Filters dropdown on the Alerts page
    Given user is on the Alerts tab
    When user clicks on the Filter dropdown
    Then user will see filters for Alert State and Severity


@regression, @smoke
Scenario: Default state of Filters dropdown items
    Given user is on the Alerts tab
    When user clicks on the Filters dropdown
    Then user sees that all the checkboxes are unchecked


@regression, @smoke
Scenario: Filters for Alert State
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu
    Then user will see the checkbox for Firing alert state
    And user will see the checkbox for Pending alert state
    And user will see the checkbox for Silenced alert state
    And user will see the checkbox for Not Firing alert state


@regression, @smoke
Scenario: Filters for Severity
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu
    Then user will see the checkbox for Critical severity
    And user will see the checkbox for Warning severity


@regression, @smoke, @manual
Scenario: Ability to show only Firing Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks Firing checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the alerts with Firing Alert state only if there are any


@regression, @smoke, @manual
Scenario: Ability to hide only Firing Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks all checkboxes
    And user unchecks Firing checkbox
    Then user will not see the alerts with Firing Alert state only


@regression, @smoke, @manual
Scenario: Ability to show only Pending Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks Pending checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the alerts with Pending Alert state only if there are any


@regression, @smoke, @manual
Scenario: Ability to hide only Pending Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks all checkboxes
    And user unchecks Pending checkbox
    Then user will not see the alerts with Pending Alert state only


@regression, @smoke, @manual
Scenario: Ability to show only Silenced Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks Silenced checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the alerts with Silenced Alert state only if there are any


@regression, @smoke, @manual
Scenario: Ability to hide only Silenced Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks all checkboxes
    And user unchecks Silenced checkbox
    Then user will not see the alerts with Silenced Alert state only


@regression, @smoke, @manual
Scenario: Ability to show only Not Firing Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks Not Firing checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the alerts with Not Firing Alert state only if there are any


@regression, @smoke, @manual
Scenario: Ability to hide only Not Firing Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks all checkboxes
    And user unchecks Firing checkbox
    Then user will not see the alerts with Not Firing Alert state only


@regression, @smoke, @manual
Scenario: Ability to show only Critical Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks Critial checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the alerts with Critical Alert state only if there are any


@regression, @smoke, @manual
Scenario: Ability to hide only Critical Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks all checkboxes
    And user unchecks Critical checkbox
    Then user will not see the alerts with Critical Alert state only


@regression, @smoke, @manual
Scenario: Ability to show only Warning Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks Warning checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the alerts with Warning Alert state only if there are any


@regression, @smoke, @manual
Scenario: Ability to hide only Warning Alerts on the Alerts tab
    Given user is on the Alerts tab
    When user clicks on the Filter drop down menu 
    And user checks all checkboxes
    And user unchecks Warning checkbox
    Then user will not see the alerts with Warning Alert state only
