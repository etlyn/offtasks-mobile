import AsyncStorage from '@react-native-async-storage/async-storage';
import {createLocalTask, deleteLocalTask, GUEST_ID, localTasksKey, readLocalTasks, updateLocalTask} from '../src/lib/localTasks';

beforeEach(async () => { await AsyncStorage.clear(); jest.restoreAllMocks(); });

test('guest CRUD persists independently and concurrent writes are serialized', async () => {
  const values = {content: 'Local task', date: null, isComplete: false, priority: 0, target_group: 'upcoming' as const};
  const [first, second] = await Promise.all([createLocalTask(GUEST_ID, values), createLocalTask(GUEST_ID, values)]);
  expect(await readLocalTasks(GUEST_ID)).toHaveLength(2);
  expect(await readLocalTasks('account')).toEqual([]);
  await updateLocalTask(GUEST_ID, first.id, {content: 'Edited', isComplete: true});
  expect((await readLocalTasks(GUEST_ID))[0]).toMatchObject({content: 'Edited', isComplete: true});
  await deleteLocalTask(GUEST_ID, second.id);
  expect(await readLocalTasks(GUEST_ID)).toHaveLength(1);
});

test('failed writes preserve data and corrupt storage is never overwritten', async () => {
  await AsyncStorage.setItem(localTasksKey(GUEST_ID), '{broken');
  await expect(deleteLocalTask(GUEST_ID, 'missing')).rejects.toThrow();
  expect(await AsyncStorage.getItem(localTasksKey(GUEST_ID))).toBe('{broken');
  await AsyncStorage.setItem(localTasksKey(GUEST_ID), '[]');
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage full'));
  await expect(createLocalTask(GUEST_ID, {content: 'Keep', date: null, isComplete: false, priority: 0, target_group: 'today'})).rejects.toThrow('Storage full');
  expect(await readLocalTasks(GUEST_ID)).toEqual([]);
});