Feature: Web Terminal
    As a user, I should be able to use web terminal


Background:
    Given user is at developer perspective
    And user has installed Web Terminal operator
    And user has selected namespace "aut-terminal-basic"


@regression, @smoke
Scenario: Web Terminal window
    Given user can see terminal icon on masthead
    When user clicks on the Web Terminal icon on the Masthead
    Then user will see the terminal window


@regression
Scenario: Web Terminal in new tab
    Given user can see terminal icon on masthead
    When user clicks on the Web Terminal icon on the Masthead
    And user clicks on Open Terminal in new tab button on the terminal window
    Then user will see the terminal window opened in new tab
