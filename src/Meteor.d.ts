import { AsyncStorageStatic } from "@react-native-async-storage/async-storage";

declare module '@meteorrn/core' {
  type Callback = (...args: unknown[]) => void;
  
  type Status =
    | 'change'
    | 'connected'
    | 'disconnected'
    | 'loggingIn'
    | 'loggingOut';

  type useTracker<T> = (cb: () => T) => T

  interface Data {
    getUrl(): string;
    waitDdpReady(cb: Callback): void;
    onChange(cb: Callback): void;
    offChange(cb: Callback): void;
    on(eventName: string, cb: Callback): void;
    off(eventName: string, cb: Callback): void;
    waitDdpConnected(cb: Callback): void;
    ddp: {
      sub: (name: string, params: any) => string;
      unsub: (id: string) => void;
      socket: unknown;
    };
  }

  interface MeteorError {
    error: string
    reason?: string
    details?: string
  }

  interface User {
    _id: string;
    version: number;
    username: string;
    profile: {
      settings: {};
    };
  }

  interface ConnectOptions {
    suppressUrlErrors: boolean
    AsyncStorage: AsyncStorageStatic
    reachabilityUrl: string
  }

  interface Meteor {
    connect(endpoint: string, options?: ConnectOptions): void;
    disconnect(): void;
    reconnect(): void;

    call(...args: any[]): void;
    status(): {
      connected: boolean;
      status: Status;
    };

    logout(cb: Callback): void;
    loggingOut(): boolean;
    loggingIn(): boolean;

    getData(): Data;
    user(): User | undefined;
    getAuthToken(): string;

    readonly isVerbose: boolean;
    enableVerbose(): void;

    useTracker<T>(): useTracker<T>;

    ddp: Data; 

    _handleLoginCallback(err?: MeteorError, res: { token: string, id: string }): void;
  }

  interface Accounts {
    onLogin(cb: Callback): void;
  }

  // Export default Meteor object
  const Meteor: Meteor;
  export default Meteor;

  // Export other members
  export {
    useTracker,
    Accounts,
  }
}
