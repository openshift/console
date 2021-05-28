@monitoring
Feature: Alert Icon on Topology for Workloads in sidebar and Alerts tab on Monitoring page
    User should be aware of alerts related to workloads and should see alerts in the sidebar


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-monitoring-topology"


        @regression @manual
        Scenario: Alerts tab on the Monitoring page: M-05-TC01
            Given user is at the Topology page
             When user opens Monitoring page
             Then user will see the Alerts tab


        @regression @manual
        Scenario: Monitoring Firing Alerts Decorator on the workload: M-05-TC02
            Given user is at Topology page
              And user has a node with firing alerts
             Then user will see the Monitoring Alerts Decorator on the upper left quadrant of that workload


        @regression @manual
        Scenario: Click on Firing Alerts Decorator on Topology workloads to see associated alerts in both graph and list view: M-05-TC03
            Given user is at Topology page
              And user has a node with firing alerts
             When user clicks on the monitoring alert decorator on the node
             Then sidebar for that node will get opened
              And user will see that monitoring tab is selected by default
              And user will see an alerts section having the associated alerts listed in the order of severity


        @regression @to-do
        Scenario: Redirect to Alert Details page on click of alert: M-05-TC04
            Given user is at the Topology page
              And user has a node with firing alerts
             When user clicks on node to open the sidebar
              And user clicks on an alert in the Alert section under Monitoring Tab
             Then user will be redirected to Alerts details page


        @regression @to-do
        Scenario: Associated Metrics on selection of Alerts in Alerts tab: M-05-TC05
            Given user is on the Monitoring page
             When user opens the Alerts tab
              And user clicks on the alert under alert rules
              And user clicks on the View Metrics button on the alert details page
             Then user will be redirected to Metrics tab
              And user will see that associated metrics has been opened


        @regression @to-do
        Scenario: Notification Column on the Alerts table: M-05-TC06
            Given user is on the Monitoring page
             When user opens the Alerts tab
             Then user will see the Notification column


        @regression @to-do
        Scenario: Alerting rule details page: M-05-TC07
            Given user is on the Alerts tab
             When user clicks on the kebab menu to view alerting rule
             Then user will be redirected to the Alert Rule Details page


        @regression @to-do
        Scenario: Notification Silence button: M-05-TC08
            Given user is on the Alerts tab
             When user clicks on the Notification Silence button
             Then user will see a Silence for dropdown
              And user will see silence for 30 minutes item
              And user will see silence for 1 hour item
              And user will see silence for 2 hours item
              And user will see silence for 1 day item


        @regression @manual
        Scenario: Display expire time of Notification Silence: M-05-TC09
            Given user is on the Alerts tab
             When user clicks on the Notification Silence button
              And user will silence the notification for 30 minutes
             Then user will see the expire time of silence
              And user will not see the severity icon at the beginning of the row of rule


        @regression @to-do
        Scenario: Switch on the Notification: M-05-TC10
            Given user is on the Alerts tab
             When user clicks on the Notification Silence button
              And user clicks on the Notification Silence button again
             Then user will see that Notifications are on again
