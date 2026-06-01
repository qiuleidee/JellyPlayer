import { apiClient } from './client';

export interface SyncPlayGroup {
  GroupId: string;
  Status: string;
  Users: string[];
}

export async function createSyncPlayGroup(): Promise<void> {
  await apiClient.post('/SyncPlay/NewGroup');
}

export async function joinSyncPlayGroup(groupId: string): Promise<void> {
  await apiClient.post('/SyncPlay/JoinGroup', { GroupId: groupId });
}

export async function leaveSyncPlayGroup(): Promise<void> {
  await apiClient.post('/SyncPlay/LeaveGroup');
}
