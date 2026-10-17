import type { DeckAPI } from '../../shared/contracts';

declare global {
  interface Window {
    deck?: DeckAPI;
  }
}
