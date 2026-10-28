import { supabaseClient } from '@/lib/supabase';

export type ChatGPTStatus = {
  status: 'unavailable' | 'disconnected' | 'reconnect' | 'authorized';
  installUrl: string | null;
  permissions: ('read' | 'write')[];
  revision: string | null;
};

/** Never open an arbitrary URL returned by a changed or misconfigured backend. */
export function parseChatGPTStatus(value: unknown): ChatGPTStatus {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Connection status unavailable');
  }
  const data = value as Record<string, unknown>;
  if (
    !['unavailable', 'disconnected', 'reconnect', 'authorized'].includes(
      String(data.status),
    )
  ) {
    throw new Error('Connection status unavailable');
  }
  const installUrl =
    typeof data.install_url === 'string' &&
    /^https:\/\/chatgpt\.com\/plugins\/[A-Za-z0-9_/-]+$/.test(data.install_url)
      ? data.install_url
      : null;
  const permissions = Array.isArray(data.permissions)
    ? data.permissions.filter(
        (item): item is 'read' | 'write' => item === 'read' || item === 'write',
      )
    : [];
  const revision =
    typeof data.revision === 'string' && /^\d+$/.test(data.revision)
      ? data.revision
      : null;
  if (
    data.status === 'authorized' &&
    (!permissions.includes('read') || !revision)
  ) {
    throw new Error('Connection status unavailable');
  }
  return {
    status: data.status as ChatGPTStatus['status'],
    installUrl,
    permissions,
    revision,
  };
}

export async function readChatGPTStatus(): Promise<ChatGPTStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const { data, error } = await supabaseClient
      .rpc('offtask_chatgpt_status')
      .abortSignal(controller.signal);
    // Older deployments do not yet have the optional integration migration.
    if (error?.code === 'PGRST202') {
      return {
        status: 'unavailable',
        installUrl: null,
        permissions: [],
        revision: null,
      };
    }
    if (error) throw new Error('Connection status unavailable');
    return parseChatGPTStatus(data);
  } finally {
    clearTimeout(timeout);
  }
}

export async function revokeChatGPT(
  owner: string,
  revision: string,
  requestKey: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const { error } = await supabaseClient
      .rpc('offtask_chatgpt_revoke', {
        expected_owner: owner,
        expected_revision: revision,
        request_key: requestKey,
      })
      .abortSignal(controller.signal);
    if (error) throw new Error('Could not confirm disconnect.');
  } finally {
    clearTimeout(timeout);
  }
}
