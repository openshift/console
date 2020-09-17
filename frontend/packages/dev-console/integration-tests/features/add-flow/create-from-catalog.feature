Feature: Create Application from Catalog file
    As a user I want to create the application, component or service from Add Flow Catlog file

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-addflow-catalog"
    And user is at Add page


Scenario: Developer Catalog page details
    When user selects From Catalog card from add page
    Then user will be redirected to Developer Catalog page
    And user is ale to see Operator Backed, Helm Charts, Builder Image, Template, Service Class types are not selected by default
    And search option is displayed in Developer Catalog page
    And GroupBy filter is selected with default option None


Scenario: Search builder image from Catalog page
    Given user is at Developer Catlog page
    When user searches "Node" card from catalog page
    Then user is able to see cards with name contains "Node"


Scenario Outline: Filter the cards with type
    Given user is at Developer Catlog page
    When user selects "<type>" option from Type section
    Then user is able to see cards related to "<type>"

Examples:
    | type            |
    | Operator Backed |
    | Helm Charts     |
    | Builder Images  |
    | Template        |
    | Service Class   |


Scenario: Filter the catalog using GroupBy option
    Given user is at Developer Catlog page
    When user searches "node" card from catalog page
    Then user is able to see cards with name contains "node"


Scenario: Create the workload using template
    Given user is at Developer Catlog page
    When user selects "Template" option from Type section
    And user selects Template card "CakePHP + MySQL" from catalog page
    And user clicks Instantiate Template button on side bar
    And user eneters Name as "php-one" in Instantiate Template page
    And user clicks create button on Instantiate Template page with default values
    And user will be redirected to Topology page
    And user is able to see workload "php-one" in topology page


Scenario: Create the workload using Builder Image
    Given user is at Developer Catlog page
    When user selects "Builder Image" option from Type section
    Then user is able to see cards with name contains "node"


@manual
Scenario: Create the workload using Service Class
    Given user is at Developer Catlog page
    When user selects "Service Class" option from Type section
    Then user is able to see cards with name contains "node"
