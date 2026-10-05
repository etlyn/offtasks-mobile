import { shouldReviewGuestItems } from '../src/lib/guestImportReview';
import { readLocalTasks } from '../src/lib/localTasks';
import { readPlanner } from '../src/lib/plannerSync';

jest.mock('../src/lib/localTasks', () => ({
  GUEST_ID: 'device-guest',
  readLocalTasks: jest.fn(),
}));
jest.mock('../src/lib/plannerSync', () => ({ readPlanner: jest.fn() }));

beforeEach(() => {
  (readLocalTasks as jest.Mock).mockResolvedValue([]);
  (readPlanner as jest.Mock).mockResolvedValue([]);
});

test('an empty guest can go straight to the account workspace', async () => {
  expect(await shouldReviewGuestItems()).toBe(false);
});

test.each(['tasks', 'note', 'goal'])(
  'guest %s trigger an optional review without importing anything',
  async kind => {
    if (kind === 'tasks')
      (readLocalTasks as jest.Mock).mockResolvedValue([{ id: 'kept' }]);
    else
      (readPlanner as jest.Mock).mockImplementation(
        async (_owner, collection) => (collection === kind ? ['kept'] : []),
      );
    expect(await shouldReviewGuestItems()).toBe(true);
  },
);

test('unreadable device storage does not prevent authentication', async () => {
  (readLocalTasks as jest.Mock).mockRejectedValue(new Error('unavailable'));
  await expect(shouldReviewGuestItems()).resolves.toBe(true);
});
