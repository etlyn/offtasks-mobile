@e2e @mobile @scheduling @categories
# Feature code: 6
Feature: Mobile scheduling and category lifecycle
    The mobile composer should keep date placement, priority, and reusable categories consistent across tabs and statistics.

    Background:
        Given the tester is signed in to the mobile app
        And the overview contains tasks that can be safely edited or removed

    # Scenario code: 6.1
    Scenario: Schedule tasks through Today, Tomorrow, and Later controls
        When the tester opens the task composer
        And the tester creates separate tasks for Today, Tomorrow, and Later
        Then each task should appear in the matching overview tab
        And the Later task should keep either the selected future date or backlog state

    # Scenario code: 6.2
    Scenario: Pick a custom Later date
        Given the task composer is open
        When the tester opens the Later date picker
        And the tester selects a future date
        Then the Later segment should show the selected date label
        And the saved task should remain in Later with that date

    # Scenario code: 6.3
    Scenario: Normalize a past date when editing
        Given a task can be edited from the active list
        When the tester attempts to set a scheduled date before today
        And the tester saves the task
        Then the app should normalize the date to today or later
        And the task should not appear under the wrong tab

    # Scenario code: 6.4
    Scenario: Create and select a custom category from the composer
        When the tester types a category name that is not in the suggestions
        And the tester taps the Add category suggestion
        Then the category should become selected on the composer
        And the saved task should show the category label

    # Scenario code: 6.5
    Scenario: Delete a reusable category without mutating existing labels
        Given the category suggestion list includes a reusable category
        When the tester deletes that category and confirms removal
        Then the category should disappear from future suggestions
        And existing task labels using that category should stay on those tasks

    # Scenario code: 6.6
    Scenario: Reuse categories while editing from statistics
        Given the tester opens the Statistics screen
        When the tester edits a task from the closed or search results list
        And the tester selects a reusable category and priority
        Then the updated task should keep those values after refresh