import React from 'react';
import { Alert, Linking } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ChatGPTConnection } from '../src/components/ChatGPTConnection';
import {
  readChatGPTStatus,
  revokeChatGPT,
  parseChatGPTStatus,
} from '../src/lib/chatgptConnection';
import { supabaseClient } from '../src/lib/supabase';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/lib/supabase', () => ({
  supabaseClient: { rpc: jest.fn() },
}));
jest.mock('../src/lib/chatgptConnection', () => ({
  ...jest.requireActual('../src/lib/chatgptConnection'),
  readChatGPTStatus: jest.fn(),
  revokeChatGPT: jest.fn(),
}));

const read = jest.mocked(readChatGPTStatus),
  revoke = jest.mocked(revokeChatGPT);
beforeEach(() => {
  jest.clearAllMocks();
});

test('invalid connection data and third-party links never become a connect action', () => {
  expect(
    parseChatGPTStatus({
      status: 'disconnected',
      install_url: 'https://chatgpt.com.evil.example/plugins/x',
    }).installUrl,
  ).toBeNull();
  expect(
    parseChatGPTStatus({
      status: 'disconnected',
      install_url: 'https://chatgpt.com/plugins/offtasks',
    }).installUrl,
  ).toBe('https://chatgpt.com/plugins/offtasks');
  expect(() =>
    parseChatGPTStatus({ status: 'authorized', permissions: ['write'] }),
  ).toThrow();
  expect(() => parseChatGPTStatus({ status: 'made-up' })).toThrow();
});

test('an older backend shows coming soon, while an actual network error stays an error', async () => {
  const actual = jest.requireActual('../src/lib/chatgptConnection');
  const rpc = supabaseClient.rpc as jest.Mock;
  rpc.mockReturnValueOnce({
    abortSignal: async () => ({ data: null, error: { code: 'PGRST202' } }),
  });
  await expect(actual.readChatGPTStatus()).resolves.toEqual({
    status: 'unavailable',
    installUrl: null,
    permissions: [],
    revision: null,
  });
  rpc.mockReturnValueOnce({
    abortSignal: async () => ({ data: null, error: { code: 'network_error' } }),
  });
  await expect(actual.readChatGPTStatus()).rejects.toThrow(
    'Connection status unavailable',
  );
});

test('does not advertise a connection before a listing is configured', async () => {
  read.mockResolvedValue({
    status: 'unavailable',
    permissions: [],
    revision: null,
    installUrl: null,
  });
  render(<ChatGPTConnection owner="account-a" />);
  await screen.findByText('Coming soon');
  expect(screen.queryByLabelText('Connect ChatGPT')).toBeNull();
});

test('opens only a configured listing and refreshes without presenting a false connection', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  read.mockResolvedValue({
    status: 'disconnected',
    permissions: [],
    revision: null,
    installUrl: 'https://chatgpt.com/plugins/offtasks',
  });
  render(<ChatGPTConnection owner="account-a" />);
  await screen.findByText('Not connected');
  fireEvent.press(screen.getByLabelText('Connect ChatGPT'));
  expect(open).toHaveBeenCalledWith('https://chatgpt.com/plugins/offtasks');
  expect(screen.queryByText('Read and edit access')).toBeNull();
  open.mockRestore();
});

test('disconnect requires a user action and targets the current owner and revision', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  read.mockResolvedValueOnce({
    status: 'authorized',
    permissions: ['read', 'write'],
    revision: '4',
    installUrl: null,
  });
  read.mockResolvedValue({
    status: 'disconnected',
    permissions: [],
    revision: null,
    installUrl: null,
  });
  revoke.mockResolvedValue(undefined);
  render(<ChatGPTConnection owner="account-a" />);
  await screen.findByText('Read and edit access');
  fireEvent.press(screen.getByLabelText('Disconnect ChatGPT'));
  expect(revoke).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0]?.[2];
  await act(async () => {
    buttons?.find(button => button.text === 'Disconnect')?.onPress?.();
  });
  await waitFor(() =>
    expect(revoke).toHaveBeenCalledWith(
      'account-a',
      '4',
      expect.stringMatching(/^native-/),
    ),
  );
  await screen.findByText('Coming soon');
  alert.mockRestore();
});

test('an old account response cannot overwrite the new account status', async () => {
  let finish!: (value: Awaited<ReturnType<typeof readChatGPTStatus>>) => void;
  read.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  read.mockResolvedValueOnce({
    status: 'disconnected',
    permissions: [],
    revision: null,
    installUrl: null,
  });
  const view = render(<ChatGPTConnection owner="account-a" />);
  view.rerender(<ChatGPTConnection owner="account-b" />);
  await screen.findByText('Coming soon');
  await act(async () =>
    finish({
      status: 'authorized',
      permissions: ['read', 'write'],
      revision: '5',
      installUrl: null,
    }),
  );
  expect(screen.queryByText('Read and edit access')).toBeNull();
});
