Feature: Helm release actions in topology page
    User will be able to open the context menu and side bar for the helm releases

Background:
    Given user is at developer perspecitve
    And user is at the project namespace "aut-helm-sidebar" in dev perspecitve
    And helm release "nodejs-ex-k" is present in topology page


@regression, @smoke
Scenario: Open Context Menu and check the actions available for Helm Release: HR-08-TC01
    Given user is at the topology page
    When user right clicks on the helm release
    Then user sees the context menu with actions


@regression, @smoke
Scenario: Open Side Bar for the Helm release: HR-10-TC01, HR-10-TC02
    Given user is at the topology page
    When user clicks on the helm release
    Then user sees the sidebar for the helm release
    And user sees the Details, Resources, Release Notes tabs


@regression
Scenario: Deployment Configs link on the sidebar for the Helm Release: HR-10-TC03
    Given user is on the sidebar for the helm release
    When user switches to the Resources tab
    And user clicks on the link for the deployment config of helm release
    Then user is redirected to the Deployment Config Details page for the helm release


@regression
Scenario: Build Configs link on the sidebar for the Helm Release: HR-10-TC04
    Given user is on the sidebar for the helm release
    When user switches to the Resources tab
    And user clicks on the link for the build config of helm release
    Then user is redirected to the Build Config Details page for the helm release


@regression
Scenario: Services link on the sidebar for the Helm Release: HR-10-TC05
    Given user is on the sidebar for the helm release
    When user switches to the Resources tab
    And user clicks on the link for the services of helm release
    Then user is redirected to the Service Details page for the helm release


@regression
Scenario: Image Streams link on the sidebar for the Helm Release: HR-10-TC06
    Given user is on the sidebar for the helm release
    When user switches to the Resources tab
    And user clicks on the link for the image stream of helm release
    Then user is redirected to the Image Stream Details page for the helm release


@regression
Scenario: Routes link on the sidebar for the Helm Release: HR-10-TC07
    Given user is on the sidebar for the helm release
    When user switches to the Resources tab
    And user clicks on the link for the routes of helm release
    Then user is redirected to the Route Details page for the helm release


@regression, @smoke
Scenario: Open Actions drop down menu on the side bar: HR-10-TC08
    Given user is on the sidebar for the helm release
    When user clicks on the Actions drop down menu
    Then user sees the "Upgrade" action item
    And user sees the "Rollback" action item
    And user sees the "Uninstall Helm Release" action item
