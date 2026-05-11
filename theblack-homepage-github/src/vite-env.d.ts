/// <reference types="vite/client" />

interface Window {
  ChannelIO?: (...args: unknown[]) => void;
  ChannelIOInitialized?: boolean;
}
