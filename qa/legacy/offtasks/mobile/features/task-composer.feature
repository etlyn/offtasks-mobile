@e2e @mobile @task-composer
# Feature code: 3
Feature: Mobile task composer and task lifecycle
    The mobile task composer should support creating, editing, completing, and deleting tasks.

    Background:
        Given the tester is signed in to the mobile app
        And the overview contains at least one editable task

    # Scenario code: 3.1
    Scenario: Create a task from the active tab
        When the tester opens the task composer
        And the tester enters task content, a scheduled date, a priority, and an optional category label
        And the tester saves the task
        Then the new task should appear in the expected task group

    # Scenario code: 3.2
    Scenario: Edit an existing task
        Given an existing task is visible in the list
        When the tester opens the task editor for that item
        And the tester changes the content, priority, date, or category
        And the tester saves the task
        Then the list should show the updated values

    # Scenario code: 3.3
    Scenario: Complete and reopen a task
        Given an open task is visible in the list
        When the tester marks the task as completed
        Then the task should reflect a completed state and move according to the current rules
        When the tester restores or reopens the same task
        Then the task should return to an active state without duplicate entries

    # Scenario code: 3.4
    Scenario: Delete a task from the mobile list
        Given an existing task is visible in the list
        When the tester deletes that task and confirms any warning dialog
        Then the task should disappear from the list after the next refresh

    # Scenario code: 3.5
    Scenario: Prevent submitting a blank task from the composer
        When the tester opens the task composer
        And the task content field is empty or whitespace only
        Then the Save action should remain disabled
        And the active tab should not receive a blank task

    # Scenario code: 3.6
    Scenario: Inspect task details from an advanced list item
        Given Advanced Mode is enabled
        And at least one task is visible in the active list
        When the tester long-presses the task item
        Then a task details alert should show content, scheduled date, section, priority, and status