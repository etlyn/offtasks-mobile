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
    'pageSheet',
  );
  expect(view.UNSAFE_getByType(Modal).props.animationType).toBe('none');
  fireEvent.press(screen.getByLabelText('Choose task date'));
  expect(props.onChangeDate).not.toHaveBeenCalled();
  expect(props.onChangeGroup).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Hide date picker'));
  expect(props.onChangeDate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Priority: High'));
  expect(props.onSelectPriority).toHaveBeenCalledWith(3);
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
