@monitoring
Feature: Filter for Alert state and Severity
    User should be able to filter out alerts as per Alert State and Severity


        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-monitoring-alerts"
        # To configure the alerts on cluster - need to execute below yaml files from monitoring YAMLs test data
        # cluster-monitoring-config.yaml, workload-monitoring-config.yaml, prometheous-example.yaml
              And user is at Monitoring page


        @smoke
        Scenario: Filters dropdown on the Alerts page: M-03-TC01
            Given user is on the Alerts tab
             When user clicks on the Filter dropdown
             Then user is able to see Firing, Pending, Silenced and Not Firing filters under Alert State type
              And user is able to see Critical, Warning, Info and None filters under Severity type
              And user is able to see filters as unchecked


        @regression @manual
        Scenario Outline: Ability to show only "<alert_state>" Alerts on the Alerts tab: M-03-TC02
            Given user is on the Alerts tab
             When user selects the "<alert_state>" option under Alert State type
             Then user will see the only "<alert_state>" alerts if there are any

        Examples:
                  | alert_state |
                  | Firing      |
                  | Pending     |
                  | Silenced    |
                  | Not Firing  |


        @regression @manual
        Scenario Outline: Ability to show only "<severity>" Alerts on the Alerts tab: M-03-TC03
            Given user is on the Alerts tab
             When user selects the "<severity>" option under Severity type
             Then user will see the only "<severity>" alerts if there are any

        Examples:
                  | severity |
                  | Critical |
                  | Warning  |
                  | Info     |
                  | None     |


        @regression @manual
        Scenario Outline: Ability to hide only "<alert_state>" Alerts on the Alerts tab: M-03-TC04
            Given user is on the Alerts tab
             When user selects the "<alert_state>" option under Alert State type
             Then user will not see the "<alert_state>" alerts

        Examples:
                  | alert_state |
                  | Firing      |
                  | Pending     |
                  | Silenced    |
                  | Not Firing  |


        @regression @manual
        Scenario Outline: Ability to hide only "<severity>" Alerts on the Alerts tab: M-03-TC05
            Given user is on the Alerts tab
             When user selects the "<severity>" option under Severity type
             Then user will not see the "<severity>" alerts

        Examples:
                  | severity |
                  | Critical |
                  | Warning  |
                  | Info     |
                  | None     |


        @regression @to-do
        Scenario: Alert details page: M-03-TC06
            Given user is on Alerts tab
             When user clicks on the name of the alert
             Then user will see Alert details page
              And user will see alert Metrics
              And user will see Name, Severity, Labels, Source, State, Alerting rule


        @regression @to-do
        Scenario: Time range on Metrics in Alert details page: M-03-TC07
            Given user is on Alert details page
             When user selects "1 hour" on Time range dropdown
             Then user will see alert activity for past one hour


        @regression @to-do
        Scenario: Reset Zoom on Metrics in Alert details page: M-03-TC08
            Given user is on Alert details page
             When user selects "1 hour" on Time range dropdown
              And user clicks on Reset zoom
             Then user will see Time range changed to 30 minutes


        @regression @to-do
        Scenario: Navigating to Metrics tab from Alert details page: M-03-TC09
            Given user is on Alert details page
             When user clicks on View in Metrics
             Then user will be taken to Metrics tab in Monitoring


        @regression @to-do
        Scenario: Silence alert from Alert details page: M-03-TC10
            Given user is on Alert details page
             When user clicks on Silence alert button
              And user update the details and click on Silence
             Then user will be taken to Silence details page with silence state Active


        @regression @to-do
        Scenario: Alert Rule details page: M-03-TC11
            Given user is on Alerts tab
             When user clicks on the kebab menu on the alert
              And user clicks on View Alerting Rule
             Then user will see Alerting rule details page
              And user will see Alert metrics in Active alerts section
              And user will see Name, Severity, Labels, Source, For, Expression, Description


        @regression @to-do
        Scenario: Time range on Metrics in Alert rule details page: M-03-TC12
            Given user is on Alert rule details page
             When user selects "1 hour" on Time range dropdown
             Then user will see alert activity for past one hour


        @regression @to-do
        Scenario: Reset Zoom on Metrics in Alert rule details page: M-03-TC13
            Given user is on Alert rule details page
             When user selects "1 hour" on Time range dropdown
              And user clicks on Reset zoom
             Then user will see Time range changed to 30 minutes


        @regression @to-do
        Scenario: Navigating to Metrics tab from Alert rule details page: M-03-TC14
            Given user is on Alert rule details page
             When user clicks on View in Metrics
             Then user will be taken to Metrics tab in Monitoring


        @regression @to-do
        Scenario: Navigating to Alert details page from Alert rule details page: M-03-TC15
            Given user is on Alert rule details page
             When user clicks on name on alert under description
             Then user will be taken to Alert details page
