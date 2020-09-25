Feature: Getting started with serverless feature
	As a user, I want to take a guided tour of getting started with serverless feature   

@regression
Scenario: Quick tour card on +Add page
   Given user is in developer perspective
   When user goes to +Add page 
   Then user sees quick tour card 
   And user sees three Quick Start link present on it
   And user sees the "See all Quick Starts" from the bottom of the card
   And user sees the kebab menu on top right of the card

@regression
Scenario: Quick tour page when no tour has started
   Given user is in developer perspective
   When user goes to +Add page 
   And user sees quick tour card 
   And user clicks on the "See all Quick Starts" 
   Then user sees four Quick Starts
   And user sees time taken to complete the tour on the card
   And user sees Start the tour link
 
@regression
Scenario: Quick tour page when tour has completed
   Given user is in developer perspective
   When user goes to +Add page 
   And user sees quick tour card 
   And user clicks on the "See all Quick Starts" 
   Then user sees four Quick Starts
   And user sees time taken to complete the tour on the card
   And user sees Complete label
   And user sees Review the tour link
 
@regression
Scenario: Quick tour page when tour is not completed
   Given user is in developer perspective
   When user goes to +Add page 
   And user sees quick tour card 
   And user clicks on the "See all Quick Starts"
   Then user sees four Quick Starts
   And user sees time taken to complete the tour on the card
   And user sees In Progress label
   And user sees Resume the tour and Restart the tour link

@regression
Scenario: Remove quick tour card from +Add view
   Given user is in developer perspective
   When user goes to +Add page 
   And user sees quick tour card 
   And user clicks on the kebab menu in the card
   And user clicks on Remove quick starts
   Then quick start card will be removed from +Add page
