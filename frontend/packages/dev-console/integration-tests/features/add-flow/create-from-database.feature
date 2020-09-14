Feature: Create Application from Database
    As a user, I want to create the application, component or service from Database using Add Flow

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-addflow-database"


@regression, @smoke
Scenario: Create the Database from Add page : A-10-TC01
    Given user is at Add page
    When user clicks Database card
    And user selects "MariaDB" database on Developer Catalog
    And user clicks Instantiate Template button on side bar
    And user clicks create button on Instantiate Template page with default values
    Then user will be redirected to Topology page
    And user is able to see workload "mariadb" in topology page
