Feature: Scroll Bar and Filter option on Event Sources Page
    User should be able to visit all the rows using scroll bar. Also user should be able to filter the event source using name.


Background: 
    Given user is at Developer Perspective


@regression
Scenario: Scroll bar on the Event Sources cards page
    Given user is at the Event Sources page
    And user has added more than 10 Event Sources
    Then user will see the Scroll bar added to see all the card


@regression
Scenario: Filter the Event Sources
    Given user is at the Event Sources page
    When user enters characters in the Filter field
    Then user will see only those event source cards that match the filters


@regression, @manual
Scenario: No Match Found
    Given user is at the Event Sources page
    When user enters something in the Filter field which doesn't match with any Event Source
    Then user will see the empty state with message "No Results Match the Filter Criteria"
    And user will see a button to clear all filters


@regression, @manual
Scenario: Selected card will be shown even though filters doesn't match
    Given user is at the Event Sources page
    When user selects a card
    And user enters characters in the Filter field that doesn't match with selected card
    Then user will see that selected card even though filters doesn't match
