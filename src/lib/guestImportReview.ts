import { GUEST_ID, readLocalTasks } from './localTasks';
import { readPlanner } from './plannerSync';

export async function shouldReviewGuestItems() {
  try {
    const collections = await Promise.all([
      readLocalTasks(GUEST_ID),
      readPlanner(GUEST_ID, 'note'),
      readPlanner(GUEST_ID, 'goal'),
    ]);
    return collections.some(items => items.length > 0);
  } catch {
    // Local storage trouble must never block sign-in. Offer the explicit
    // account import tools, which already report errors without altering data.
    return true;
  }
}
