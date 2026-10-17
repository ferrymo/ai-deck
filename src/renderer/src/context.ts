import { createContext, useContext } from 'react';
import type { Page, Snapshot } from '../../core/models';
import type { DeckAPI } from '../../shared/contracts';
export interface AppContextValue {
  state: Snapshot;
  api: DeckAPI;
  busy: boolean;
  preview: boolean;
  navigate: (page: Page) => void;
  perform: (work: () => Promise<Snapshot> | Promise<void>, success?: string) => Promise<void>;
  notify: (message: string) => void;
  inspect: (id: string) => void;
}
export const AppContext = createContext<AppContextValue | null>(null);
export function useDeck(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('缺少应用上下文');
  return value;
}
