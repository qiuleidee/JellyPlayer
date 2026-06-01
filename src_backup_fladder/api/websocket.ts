export type WsMessageType = 
  | 'ForceKeepAlive'
  | 'GeneralCommand'
  | 'UserDataChanged'
  | 'SessionModeChanged'
  | 'Play'
  | 'SyncPlayCommand'
  | 'SyncPlayGroupUpdate'
  | 'Playstate'
  | 'RestartRequired'
  | 'ServerShuttingDown'
  | 'ServerRestarting'
  | 'LibraryChanged'
  | 'UserDeleted'
  | 'UserUpdated'
  | 'SeriesTimerCreated'
  | 'TimerCreated'
  | 'SeriesTimerCancelled'
  | 'TimerCancelled'
  | 'RefreshProgress'
  | 'ScheduledTaskEnded'
  | 'PackageInstallationCompleted'
  | 'PackageInstallationFailed'
  | 'PackageInstallationCancelled'
  | 'PackageUninstalled'
  | 'ActivityLogEntry'
  | 'ScheduledTasksInfo'
  | 'ActivityLogEntryStart'
  | 'ActivityLogEntryStop'
  | 'SessionsStart'
  | 'SessionsStop'
  | 'ScheduledTasksInfoStart'
  | 'ScheduledTasksInfoStop'
  | 'KeepAlive';

export interface WsMessage<T = any> {
  MessageType: WsMessageType;
  MessageId?: string;
  Data: T;
}

export interface LibraryChangedData {
  FoldersAddedTo?: string[];
  FoldersRemovedFrom?: string[];
  ItemsAdded?: string[];
  ItemsRemoved?: string[];
  ItemsUpdated?: string[];
}

export interface UserDataChangedData {
  UserId: string;
  UserDataList: Array<{
    ItemId: string;
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    Key: string;
  }>;
}
