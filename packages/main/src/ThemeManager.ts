import {app, nativeTheme} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface AppConfig {
  theme: 'system' | 'light' | 'dark';
}

const CONFIG_FILE_NAME = 'config.json';

function getConfigPath() {
  return path.join(app.getPath('userData'), CONFIG_FILE_NAME);
}

function loadConfig(): AppConfig {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return {theme: 'system'};
}

function saveConfig(config: AppConfig) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

export const ThemeManager = {
  getTheme: (): 'system' | 'light' | 'dark' => {
    return loadConfig().theme;
  },

  setTheme: (theme: 'system' | 'light' | 'dark') => {
    const config = loadConfig();
    config.theme = theme;
    saveConfig(config);
    nativeTheme.themeSource = theme;
  },

  init: () => {
    const theme = loadConfig().theme;
    nativeTheme.themeSource = theme;
  },
};
