import React from 'react';
import { Alert, Modal } from 'react-native';
import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { TaskComposerModal } from '../src/features/dashboard/components/TaskComposerModal';
import { GentlePressable } from '../src/components/ProductUI';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));

const fixture = (): React.ComponentProps<typeof TaskComposerModal> => ({
  visible: true,
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

afterEach(() => jest.restoreAllMocks());

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
  fireEvent.press(screen.getByLabelText('Hide date picker'));
  expect(props.onChangeDate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Choose task priority'));
  fireEvent.press(screen.getByLabelText('Priority: High'));
  expect(props.onSelectPriority).toHaveBeenCalledWith(3);
});

test('regular task entry needs no priority or goal and has no scheduling shortcuts', () => {
  const props = fixture();
  render(<TaskComposerModal {...props} />);
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

test('date-only edits require confirmation before dismissing', () => {
  const props = fixture();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const view = render(<TaskComposerModal {...props} />);
  view.rerender(<TaskComposerModal {...props} selectedDate="2027-03-19" />);
  fireEvent.press(screen.getByLabelText('Cancel task'));
  expect(props.onClose).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith(
    'Discard changes?',
    expect.any(String),
    expect.any(Array),
  );
  const buttons = alert.mock.calls[0][2];
  act(() => buttons?.find(button => button.text === 'Discard')?.onPress?.());
  expect(props.onClose).toHaveBeenCalledTimes(1);
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
