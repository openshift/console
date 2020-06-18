# Gherkin Scenarios designing Best Practices

Scenario Titles should follow below rules
    a. One line statement
    b, Use conjuction words like and, but, if at all required, but always make sure each scenario focused on one behaviour
    c. Avoid disjunction words like because, so, since etc..
    d. Avoid assertion language like verify, assert, should etc..

BDD scenarios should follow below rules
    1. Gherkin Golden Rule - Declarative sentences
        ```

        Scenario: Add shoes to the shopping cart
            Given the shoe store home page is displayed
            When the shopper searches for "red pumps"
            And the shopper adds the first result to the cart
            Then the cart has one pair of "red pumps"
        ```

    2. Cardnial Rule of BDD - One to one rule
        a. Collaboration: More focus and less confusion
        b. Automation: Each test failure points to a unique problem
        c. Efficiency: Less complex work makes for faster cycle times
        d. Traceability: 1 behavior → 1 example → 1 scenario → 1 test → 1 result
        e. Accountability: Teams cannot hide or avoid behaviors

    3. Unique Example Rule - Use efffective examples
        ```
        Scenario Outline: Simple product search
            Given the shoe store home page is displayed
            When the search phrase "<phrase>" is entered
            Then results for "<phrase>" are shown
            
            Examples: Shoes
                | phrase        |
                | red pumps     |
                | sneakers      |
        ```
    
    4. Good Grammer rule - Language matters
        a. Given [Context] - should use past or present-perfect tense, because they represent an initial state that must already be established
        b. When [Action]   - should use present tense, because they represent actions actively performed as part of the behavior. 
        c. Then [Outcome]  - should use present or future tense, because they represent what should happen after the behavior actions.

## BDD Style Guidelines

    1. Focus on customer needs
    2. Limit one feature per feature file. This makes it easy to find features. 
    3. Limit the number of scenarios per feature. Nobody wants a thousand-line feature file. A good measure is a dozen scenarios per feature. 
    4. Limit the number of steps per scenario to less than ten. 
    5. Limit the character length of each step. Common limits are 80-120 characters. 
    6. Use proper spelling. 
    7. Use proper grammar. 
    8. Capitalize Gherkin keywords. 
    9. Capitalize the first word in titles. 
    10. Do not capitalize words in the step phrases unless they are proper nouns. 
    11. Do not use punctuation (specifically periods and commas) at the end of step phrases. 
    12. Use single spaces between words. 
    13. Indent the content beneath every section header. 
    14. Separate features and scenarios by two blank lines. 
    15. Separate examples tables by 1 blank line. 
    16. Do not separate steps within a scenario by blank lines. 
    17. Space table delimiter pipes (“|”) evenly. 
    18. Adopt a standard set of tag names. Avoid duplicates. 
    19. Write all tag names in lowercase, and use hyphens (“-“) to separate words. 
    20. Limit the length of tag names. 
    21. All parameter names shoud wrap with "<>"
    22. label names, page names and popup header names should wrap with ""

## Inlcude Extensions

    "alexkrechik.cucumberautocomplete",
    "dylanmoerland.cypress-cucumber-steps"

## Reusable steps

    Given user is at the Import from git form
