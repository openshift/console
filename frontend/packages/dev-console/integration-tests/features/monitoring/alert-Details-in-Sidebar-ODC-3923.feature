Feature: Alert Icon on Topology for Workloads in sidebar and Alerts tab on Monitoring page
	User should be aware of alerts related to workloads and should see alerts in the sidebar


Background:
    Given user is at the developer perspective


@regression, @manual
Scenario: Alerts tab on the Monitoring page
    Given user is at Topology page
    When user opens Monitoring page
    Then user will see the Alerts tab


@regression, @manual
Scenario: Monitoring Firing Alerts Decorator on the workload
    Given user is at Topology page
    And user has a node with firing alerts
    Then user will see the Monitoring Alerts Decorator on the upper left quadrant of that workload


@regression, @manual
Scenario: Click on Firing Alerts Decorator on Topology workloads to see associated alerts in both graph and list view
    Given user is at Topology page
    And user has a node with firing alerts
    When user clicks on the monitoring alert decorator on the node
    Then sidebar for that node will get opened
    And user will see that monitoring tab is selected by default
    And user will see an alerts section having the associated alerts listed in the order of severity


@regression
Scenario: Redirect to Alert Details page on click of alert
    Given user is at the Topology page
    And user has a node with firing alerts
    When user clicks on node to open the sidebar
    And user clicks on an alert in the Alert section under Monitoring Tab
    Then user will be redirected to Alerts details page


@regression
Scenario: Associated Metrics on selection of Alerts in Alerts tab
    Given user is on the Monitoring page
    When user opens the Alerts tab
    And user clicks on the alert under alert rules
    And user clicks on the View Metrics button on the alert details page
    Then user will be redirected to Metrics tab
    And user will see that associated metrics has been opened


@regression
Scenario: Notification Column on the Alerts table
    Given user is on the Monitoring page
    When user opens the Alerts tab
    Then user will see the Notification column


@regression
Scenario: Alerting rule details page
    Given user is on the Alerts tab
    When user clicks on the kebab menu to view alerting rule
    Then user will be redirected to the Alert Rule Details page


@regression
Scenario: Notification Silence button
    Given user is on the Alerts tab
    When user clicks on the Notification Silence button
    Then user will see a Silence for dropdown
    And user will see silence for 30 minutes item
    And user will see silence for 1 hour item
    And user will see silence for 2 hours item
    And user will see silence for 1 day item


@regression, @manual
Scenario: Display expire time of Notification Silence
    Given user is on the Alerts tab
    When user clicks on the Notification Silence button
    And user will silence the notification for 30 minutes
    Then user will see the expire time of silence
    And user will not see the severity icon at the beginning of the row of rule


@regression
Scenario: Switch on the Notification
    Given user is on the Alerts tab
    When user clicks on the Notification Silence button
    And user clicks on the Notification Silence button again
    Then user will see that Notifications are on again
