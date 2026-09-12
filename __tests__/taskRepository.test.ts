import AsyncStorage from '@react-native-async-storage/async-storage';
import {taskRepository} from '../src/lib/taskRepository';
import * as cloud from '../src/lib/supabase';

jest.mock('../src/lib/supabase', () => ({fetchAllUserTasks: jest.fn(), createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn()}));
test('guest uses the full task contract without auth or cloud and account routes separately', async () => {
  await AsyncStorage.clear();
  const guest = taskRepository();
  await guest.create({content: 'Offline plan', target_group: 'upcoming', date: null, label: 'Personal'});
  const [task] = await guest.read();
  await guest.update(task.id, {isComplete: true});
  expect((await guest.read())[0].isComplete).toBe(true);
  expect(cloud.createTask).not.toHaveBeenCalled();
  expect(cloud.fetchAllUserTasks).not.toHaveBeenCalled();
  const account = taskRepository('test-account');
  await account.create({content: 'Cloud task', target_group: 'today'});
  expect(cloud.createTask).toHaveBeenCalledWith({userId: 'test-account', content: 'Cloud task', target_group: 'today'});
  expect(await guest.read()).toHaveLength(1);
  await guest.remove(task.id);
  expect(await guest.read()).toEqual([]);
});