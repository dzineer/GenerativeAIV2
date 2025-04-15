import { ComponentType } from 'react';

export type PanelId = 'file-explorer' | 'editor';

export interface PanelConfig {
  id: PanelId;
  title: string;
  props?: Record<string, unknown>;
}

export interface PanelRegistryEntry extends PanelConfig {
  Component: ComponentType<any>;
}

export type PanelRegistry = Map<PanelId, PanelRegistryEntry>;

export interface Theme {
  isDarkMode: boolean;
  colors: {
    background: string;
    text: string;
    border: string;
    accent: string;
  };
} 