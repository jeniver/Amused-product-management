const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = logLevels[process.env.LOG_LEVEL as keyof typeof logLevels] || logLevels.info;

export const logger = {
  error: (message: string, meta?: any) => {
    if (currentLevel >= logLevels.error) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  },
  warn: (message: string, meta?: any) => {
    if (currentLevel >= logLevels.warn) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  },
  info: (message: string, meta?: any) => {
    if (currentLevel >= logLevels.info) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  },
  debug: (message: string, meta?: any) => {
    if (currentLevel >= logLevels.debug) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  },
};
