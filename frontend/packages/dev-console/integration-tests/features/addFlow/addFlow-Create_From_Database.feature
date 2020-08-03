Feature: Create Application from Database
    As a user I want to create the application, component or service from Add Flow Database

Background:
    Given user is at dev perspecitve
    And open project namespace "aut-addflow-database"


@regression, @smoke
Scenario: Create the Database from Add page : A-10-TC01
    Given user is at Add page
    When user clicks Database card
    And user selects "MariaDB" databse on Developer Catalog
    And clicks Instantiate Template button on side pane
    And user clicks create button on Instantiate Template page with default values
    Then user redirects to Topology page
    And created workload "mariadb" is present in topology page
