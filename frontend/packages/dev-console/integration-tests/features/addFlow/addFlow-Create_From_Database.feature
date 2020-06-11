Feature: Create Application from Database
    As a user I want to create the application, component or service from Add Flow Database

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve
    And open project namespace "AUT_AddFlow_Database_Demo"


@regression, @smoke
Scenario: Create the Database from Add page : A-10-TC01
    Given user is on Add page
    When user clicks Database card
    And user selects "MariaDB" databse on Developer Catalog
    And clicks Instantiate Template button on side pane
    And user clicks create button on "Instantiate Template" page with default values
    Then page redirects to topology page
    And workload is created
