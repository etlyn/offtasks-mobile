import { taskRepository } from '../src/lib/taskRepository';
import { trackTaskCreated } from '../src/analytics';
import * as cloud from '../src/lib/supabase';
import * as local from '../src/lib/localTasks';
jest.mock('../src/providers/AuthProvider', () => ({useAuth: () => ({session:null})}));
jest.mock('../src/lib/supabase', () => ({createTask:jest.fn()}));
jest.mock('../src/lib/localTasks', () => ({GUEST_ID:'guest', createLocalTask:jest.fn()}));

beforeEach(() => jest.clearAllMocks());
test.each([undefined, 'account-id'])('task creation emits once after a confirmed write (%s)', async user => {
 let finish!: () => void;
 const write = user ? cloud.createTask : local.createLocalTask;
 (write as jest.Mock).mockImplementation(() => new Promise<void>(resolve => {finish=resolve;}));
 const action=taskRepository(user).create({content:'private task text', target_group:'today'});
 expect(trackTaskCreated).not.toHaveBeenCalled(); finish(); await action;
 expect(trackTaskCreated).toHaveBeenCalledTimes(1); expect(trackTaskCreated).toHaveBeenCalledWith();
});
test('failed writes do not count as created tasks', async () => {
 (cloud.createTask as jest.Mock).mockRejectedValue(new Error('offline'));
 await expect(taskRepository('account').create({content:'private',target_group:'today'})).rejects.toThrow('offline');
 expect(trackTaskCreated).not.toHaveBeenCalled();
});
