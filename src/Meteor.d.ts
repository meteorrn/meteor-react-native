declare module '@meteorrn/core' {
  type Callback = (...args: unknown[]) => void;

  function connect(endpoint: string, options?: any): void;
  function disconnect(): void;
  function reconnect(): void;

  type Status = 'change' | 'connected' | 'disconnected' | 'loggingIn';

  function call(...args: any[]): void;
  function status(): {
    connected: boolean;
    status: Status;
  };

  function logout(cb: Callback): void;
  function loggingOut(): boolean;
  function loggingIn(): boolean;

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
  function getData(): Data;

  interface User {
    _id: string;
    version: number;
    username: string;
    profile: {
      settings: {};
    };
  }
  function user(): User | undefined;
  interface Accounts {
    onLogin(cb: Callback): void;
  }
  function getAuthToken(): string;

  const ddp: Data;
  let isVerbose: boolean;
  function _handleLoginCallback(err: any, res: any): void;

  function useTracker<T>(cb: () => T): T;
}
