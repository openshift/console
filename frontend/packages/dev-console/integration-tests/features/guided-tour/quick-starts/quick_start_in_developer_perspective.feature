Feature: Quick Starts card in developer console
	As a user, I want to view Quick Starts card in Add page

Background:
    Given user is at developer perspective
    And sample-application CR Quick Start is available
    And add-healthchecks CR Quick Start is available
    And explore-serverless CR Quick Start is available
    And explore-pipeline CR Quick Start is available


@regression
Scenario: Quick Starts card on +Add page
   Given user is in developer perspective
   When user goes to +Add page 
   Then user can see Quick Starts card 
   And user can see three Quick Starts link present on it
   And user can see the "View all Quick Starts" on the card
   And user can see the kebab menu on top right of the card


@regression
Scenario: Quick Starts page when no tour has started
   Given user is in developer perspective
   When user goes to +Add page 
   And user clicks on the "View all Quick Starts" 
   Then user can see four Quick Starts
   And user can see time taken to complete the tour on the card
   And user can see Start the tour link


@regression
Scenario: Quick Starts page when tour has completed
   Given user is in developer perspective
   When user goes to +Add page 
   And user sees quick tour card 
   And user clicks on the "View all Quick Starts" 
   Then user can see four Quick Starts
   And user can see time taken to complete the tour on the card
   And user can see Complete label
   And user can see Review the tour link


@regression
Scenario: Quick tour page when tour is not completed
   Given user is in developer perspective
   When user goes to +Add page 
   And user clicks on the "View all Quick Starts"
   Then user can see four Quick Starts
   And user can see time taken to complete the tour on the card
   And user can see In Progress label
   And user can see Resume the tour and Restart the tour link


@regression
Scenario: Remove quick tour card from +Add view
   Given user is in developer perspective
   When user goes to +Add page 
   And user sees quick tour card 
   And user clicks on the kebab menu in the card
   And user clicks on Remove Quick Starts
   Then Quick Starts card will be removed from +Add page


@regression
Scenario: Quick Starts card links with status as in progress 
   Given user is at +Add page 
   When user clicks on first Quick Starts link on the Quick Starts card 
   And user clicks on the Start tour
   And user clicks on close button
   And user clicks on leave on leave the tour modal box
   Then user can see "In Progress" status below the first Quick Starts link


@regression
Scenario: Quick Starts card when all Quick Starts has completed
   Given user is at +Add page 
   When user completes all the Quick Starts present
   Then user can see Quick Starts card is removed from the +Add page
