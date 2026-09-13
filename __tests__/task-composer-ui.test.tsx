import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Alert, Animated, Modal } from 'react-native';
import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { TaskComposerModal } from '../src/features/dashboard/components/TaskComposerModal';
import { GentlePressable } from '../src/components/ProductUI';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
let mockReduceMotion = true;
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: mockReduceMotion,
    animateLayout: jest.fn(),
  }),
}));

const fixture = (): React.ComponentProps<typeof TaskComposerModal> => ({
  visible: true,
  goalMode: true,
  allowGoalSelection: true,
  onClose: jest.fn(),
  insetTop: 48,
  insetBottom: 34,
  newTaskContent: 'Plan trip',
  onChangeTaskContent: jest.fn(),
  onChangeGroup: jest.fn(),
  priorityOptions: ['None', 'Low', 'Medium', 'High'].map((label, value) => ({
    label,
    value,
    description: '',
    icon: 'minus',
    tint: '#152D25',
    background: '#FFF',
  })),
  onSelectPriority: jest.fn(),
  selectedPriority: 0,
  selectedCategory: null,
  onClearCategory: jest.fn(),
  submitting: false,
  onSubmit: jest.fn(),
  categoryQuery: '',
  onCategoryQueryChange: jest.fn(),
  filteredCategories: [],
  canCreateCategory: false,
  onCreateCategory: jest.fn(),
  onSelectCategory: jest.fn(),
  onDeleteCategory: jest.fn(),
  categoryPendingDelete: null,
  onCancelDeleteCategory: jest.fn(),
  onConfirmDeleteCategory: jest.fn(),
  selectedDate: '2027-03-18',
  onChangeDate: jest.fn(),
});

afterEach(() => {
  jest.restoreAllMocks();
  mockReduceMotion = true;
});

test('composer eases measured content height instead of jumping between editor and date', () => {
  mockReduceMotion = false;
  const timing = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  }));
  const view = render(<TaskComposerModal {...fixture()} />);
  const content = screen.getByTestId('task-composer-measure');
  const measure = (height: number) =>
    fireEvent(content, 'layout', {
      nativeEvent: { layout: { width: 320, height } },
    });
  measure(160);
  fireEvent.press(screen.getByLabelText('Choose task date'));
  measure(234);
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({
      toValue: 234,
      duration: 320,
      useNativeDriver: false,
      isInteraction: false,
    }),
  );
  fireEvent.press(screen.getByLabelText('Back to task'));
  measure(160);
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ toValue: 160, duration: 320 }),
  );
  mockReduceMotion = true;
  view.rerender(<TaskComposerModal {...fixture()} />);
  expect(screen.getByTestId('task-composer-content')).toHaveStyle({
    height: 160,
  });
});

test('native composer keeps the current date while opening its picker', () => {
  const props = fixture();
  const view = render(<TaskComposerModal {...props} />);
  expect(view.UNSAFE_getByType(Modal).props.presentationStyle).toBe(
    'overFullScreen',
  );
  expect(view.UNSAFE_getByType(Modal).props.animationType).toBe('none');
  fireEvent.press(screen.getByLabelText('Choose task date'));
  expect(props.onChangeDate).not.toHaveBeenCalled();
  expect(props.onChangeGroup).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Back to task'));
  expect(props.onChangeDate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Choose task priority'));
  fireEvent.press(screen.getByLabelText('Priority: High'));
  expect(props.onSelectPriority).toHaveBeenCalledWith(3);
});

test('regular task entry hides priority and goals and has no scheduling shortcuts', () => {
  const props = { ...fixture(), goalMode: false, allowGoalSelection: false };
  render(<TaskComposerModal {...props} />);
  expect(screen.queryByLabelText('Choose task priority')).toBeNull();
  expect(screen.queryByLabelText('Choose task goal')).toBeNull();
  expect(screen.queryByLabelText('Schedule today')).toBeNull();
  expect(screen.queryByLabelText('Schedule tomorrow')).toBeNull();
  expect(screen.queryByLabelText('Priority: None')).toBeNull();
  expect(screen.queryByLabelText('Find a goal')).toBeNull();
  expect(screen.getByText('Add')).toBeOnTheScreen();
  expect(screen.queryByText('New task')).toBeNull();
  expect(screen.queryByText('Cancel')).toBeNull();
  expect(screen.getByLabelText('Cancel task')).toHaveStyle({
    width: 44,
    height: 44,
  });
  fireEvent.press(screen.getByLabelText('Save task'));
  expect(props.onSubmit).toHaveBeenCalledTimes(1);
  expect(props.onSelectPriority).not.toHaveBeenCalled();
  expect(props.onSelectCategory).not.toHaveBeenCalled();
  expect(props.onCreateCategory).not.toHaveBeenCalled();
});

test('optional panels replace each other and an existing goal can be selected or cleared', () => {
  const props = { ...fixture(), filteredCategories: ['Work', 'Health'] };
  const view = render(<TaskComposerModal {...props} />);
  fireEvent.press(screen.getByLabelText('Choose task priority'));
  expect(screen.getByLabelText('Priority: None')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Choose task goal'));
  expect(screen.queryByLabelText('Priority: None')).toBeNull();
  fireEvent.press(screen.getByLabelText('Goal: Work'));
  expect(props.onSelectCategory).toHaveBeenCalledWith('Work');
  expect(screen.queryByTestId('task-options-panel')).toBeNull();
  view.rerender(<TaskComposerModal {...props} selectedCategory="Work" />);
  expect(screen.getByText('Work')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Choose task goal'));
  fireEvent.press(screen.getByLabelText('No goal'));
  expect(props.onClearCategory).toHaveBeenCalledTimes(1);
});

test('goal search is not a task edit and creation requires an explicit action', async () => {
  const props = fixture();
  const view = render(<TaskComposerModal {...props} />);
  fireEvent.press(screen.getByLabelText('Choose task goal'));
  fireEvent.changeText(screen.getByLabelText('Find a goal'), 'Personal');
  expect(props.onCategoryQueryChange).toHaveBeenCalledWith('Personal');
  view.rerender(
    <TaskComposerModal {...props} categoryQuery="Personal" canCreateCategory />,
  );
  fireEvent.press(screen.getByLabelText('Save task'));
  expect(props.onCreateCategory).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Cancel task'));
  expect(props.onClose).toHaveBeenCalledTimes(1);
  await act(async () =>
    fireEvent.press(screen.getByLabelText('Create goal: Personal')),
  );
  expect(props.onCreateCategory).toHaveBeenCalledTimes(1);
});

test('date can be removed and editing preserves existing optional values until changed', () => {
  const props = {
    ...fixture(),
    mode: 'edit' as const,
    selectedPriority: 3,
    selectedCategory: 'Work',
  };
  render(<TaskComposerModal {...props} />);
  expect(screen.getByText('Save')).toBeOnTheScreen();
  expect(screen.queryByText('Edit task')).toBeNull();
  expect(screen.getByText('High')).toBeOnTheScreen();
  expect(screen.getByText('Work')).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText('Choose task date'));
  fireEvent.press(screen.getByLabelText('No date'));
  expect(props.onChangeDate).toHaveBeenCalledWith(null);
  expect(props.onSelectPriority).not.toHaveBeenCalled();
  expect(props.onSelectCategory).not.toHaveBeenCalled();
});

test('submitting prevents double saves, dismissal, and option changes', () => {
  const props = { ...fixture(), submitting: true };
  render(<TaskComposerModal {...props} />);
  expect(screen.getByLabelText('Save task')).toBeDisabled();
  expect(screen.getByLabelText('Cancel task')).toBeDisabled();
  expect(screen.getByLabelText('Choose task goal')).toBeDisabled();
  fireEvent.press(screen.getByLabelText('Save task'));
  expect(props.onSubmit).not.toHaveBeenCalled();
});

test('changed drafts close directly without a discard confirmation', () => {
  const props = fixture();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const view = render(<TaskComposerModal {...props} />);
  view.rerender(
    <TaskComposerModal
      {...props}
      selectedDate="2027-03-19"
      newTaskContent="Updated draft"
    />,
  );
  fireEvent.press(screen.getByLabelText('Cancel task'));
  expect(alert).not.toHaveBeenCalled();
  expect(props.onClose).toHaveBeenCalledTimes(1);
});

test('date selection replaces the editor and stages wheel changes until Done', () => {
  const props = fixture();
  const view = render(<TaskComposerModal {...props} />);
  fireEvent.press(screen.getByLabelText('Choose task date'));
  expect(screen.queryByLabelText('Task content')).toBeNull();
  expect(view.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  const wheel = view.UNSAFE_getByType(DateTimePicker);
  expect(wheel.props.display).toBe('spinner');
  const chosen = new Date(2027, 3, 22);
  fireEvent(wheel, 'change', { type: 'set' }, chosen);
  expect(props.onChangeDate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Set task date'));
  expect(props.onChangeDate).toHaveBeenCalledWith('2027-04-22');
  expect(screen.getByLabelText('Task content').props.value).toBe('Plan trip');
  expect(screen.queryByTestId('task-date-step')).toBeNull();
});

test('leaving the date step without Done preserves the assigned date', () => {
  const props = fixture();
  const view = render(<TaskComposerModal {...props} />);
  fireEvent.press(screen.getByLabelText('Choose task date'));
  fireEvent(
    view.UNSAFE_getByType(DateTimePicker),
    'change',
    { type: 'set' },
    new Date(2027, 3, 22),
  );
  fireEvent.press(screen.getByLabelText('Back to task'));
  expect(props.onChangeDate).not.toHaveBeenCalled();
  expect(props.onClose).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Task content').props.value).toBe('Plan trip');
  fireEvent.press(screen.getByLabelText('Choose task date'));
  expect(view.UNSAFE_getByType(DateTimePicker).props.value).toEqual(
    new Date(2027, 2, 18),
  );
});

test('pending saves use a quiet mark, never a rotating spinner', () => {
  const view = render(<TaskComposerModal {...fixture()} submitting />);
  expect(screen.getByTestId('task-saving-pulse')).toBeOnTheScreen();
  expect(view.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  expect(screen.getByLabelText('Save task').props.accessibilityState.busy).toBe(
    true,
  );
});

test('untouched drafts close immediately and blank drafts cannot save', () => {
  const props = fixture();
  render(<TaskComposerModal {...props} newTaskContent="" />);
  expect(screen.getByLabelText('Save task')).toBeDisabled();
  fireEvent.press(screen.getByLabelText('Cancel task'));
  expect(props.onClose).toHaveBeenCalledTimes(1);
});

test('animated controls retain layout styles and disabled appearance', () => {
  render(
    <GentlePressable
      testID="control"
      disabled
      style={() => ({ minHeight: 44, borderRadius: 22 })}
    />,
  );
  expect(screen.getByTestId('control')).toHaveStyle({
    minHeight: 44,
    borderRadius: 22,
    opacity: 0.4,
  });
});

test('goal task creation exposes priority, with its goal supplied by the page', () => {
  const props = {
    ...fixture(),
    selectedCategory: 'Work',
    allowGoalSelection: false,
  };
  render(<TaskComposerModal {...props} />);
  expect(screen.getByLabelText('Choose task priority')).toBeTruthy();
  expect(screen.queryByLabelText('Choose task goal')).toBeNull();
  fireEvent.press(screen.getByLabelText('Save task'));
  expect(props.onClearCategory).not.toHaveBeenCalled();
});
test('editing a goal task from a regular page never clears its hidden metadata', () => {
  const props = {
    ...fixture(),
    goalMode: false,
    selectedCategory: 'Work',
    selectedPriority: 3,
    mode: 'edit' as const,
  };
  render(<TaskComposerModal {...props} />);
  expect(screen.queryByLabelText('Choose task priority')).toBeNull();
  expect(screen.queryByLabelText('Choose task goal')).toBeNull();
  fireEvent.press(screen.getByLabelText('Save task'));
  expect(props.onClearCategory).not.toHaveBeenCalled();
  expect(props.onSelectPriority).not.toHaveBeenCalled();
});
