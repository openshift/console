@monitoring
Feature: Filter for Alert state and Severity
	User should be able to filter out alerts as per Alert State and Severity


    Background:
        Given user is at developer perspective
        And user is at Add page 
        And user has created or selected namespace "aut-monitoring-alerts"
        # To configure the alerts on cluster - need to execute below yaml file
        # https://gist.githubusercontent.com/vikram-raj/27fa5c9d7e0cf223919c697d34bd2beb/raw/f85ab7a0e1f3e8a6270c124a4a97df13e5b9cb3c/ns-alert-setup.yaml
        And user is at Monitoring page


    @smoke
    Scenario: Filters dropdown on the Alerts page
        Given user is on the Alerts tab
        When user clicks on the Filter dropdown
        Then user is able to see Firing, Pending, Silenced and Not Firing filters under Alert State type
        And user is able to see Critical, Warning, Info and None filters under Severity type
        And user is able to see filters as unchecked


    @regression, @manual
    Scenario Outline: Ability to show only "<alert_state>" Alerts on the Alerts tab
        Given user is on the Alerts tab
        When user selects the "<alert_state>" option under Alert State type
        Then user will see the only "<alert_state>" alerts if there are any

    Examples:
        | alert_state |
        | Firing      |
        | Pending     |
        | Silenced    |
        | Not Firing  |


    @regression, @manual
    Scenario Outline: Ability to show only "<severity>" Alerts on the Alerts tab
        Given user is on the Alerts tab
        When user selects the "<severity>" option under Severity type
        Then user will see the only "<severity>" alerts if there are any

    Examples:
        | severity |
        | Critical |
        | Warning  |
        | Info     |
        | None     |


    @regression, @manual
    Scenario Outline: Ability to hide only "<alert_state>" Alerts on the Alerts tab
        Given user is on the Alerts tab
        When user selects the "<alert_state>" option under Alert State type
        Then user will not see the "<alert_state>" alerts

    Examples:
        | alert_state |
        | Firing      |
        | Pending     |
        | Silenced    |
        | Not Firing  |


    @regression, @manual
    Scenario Outline: Ability to hide only "<severity>" Alerts on the Alerts tab
        Given user is on the Alerts tab
        When user selects the "<severity>" option under Severity type
        Then user will not see the "<severity>" alerts

    Examples:
        | severity |
        | Critical |
        | Warning  |
        | Info     |
        | None     |
