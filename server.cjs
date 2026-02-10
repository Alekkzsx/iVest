const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

// File Paths - V4 Shared (Directly in data/)
const FILES = {
  PROFILE: path.join(DATA_DIR, 'profile.json'),
  HISTORY: path.join(DATA_DIR, 'history.json'),
  INTERPRETATION: path.join(DATA_DIR, 'interpretation-history.json'),
  RESOLUTIONS: path.join(DATA_DIR, 'resolutions-history.json'),
  SCHEDULE: path.join(DATA_DIR, 'schedule.json'),
  LEGACY: path.join(DATA_DIR, 'data-user.txt')
};

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large history files

// --- HELPER WRAPPERS ---

/**
 * Ensures a directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Atomic Write: Writes to temp file then renames to target
 * This prevents file corruption on power loss.
 */
async function atomicWrite(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    await fs.rename(tempPath, filePath); // Atomic operation
    console.log(`💾 Saved: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error saving ${path.basename(filePath)}:`, error);
    try { await fs.unlink(tempPath); } catch { } // Cleanup temp
    throw error;
  }
}

/**
 * Reads a JSON file or returns default if missing
 */
async function readJson(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

// --- MIGRATION LOGIC ---

async function migrateLegacyData() {
  try {
    // Check if new structure already exists
    try {
      await fs.access(FILES.PROFILE);
      return; // Already migrated
    } catch { }

    console.log('📦 Checking for legacy data to migrate...');

    // Check if legacy file exists
    try {
      await fs.access(FILES.LEGACY);
    } catch {
      console.log('ℹ️ No legacy data found. Starting fresh.');
      return;
    }

    // Read Legacy
    const oldData = await readJson(FILES.LEGACY, null);
    if (!oldData || !oldData.user) return;

    console.log('🔄 Migrating legacy data to new structure...');

    // Split Data
    const profile = {
      version: '4.0.0',
      lastUpdated: new Date().toISOString(),
      stats: oldData.user.stats || {
        questionsAnswered: 0,
        correctAnswers: 0,
        currentStreak: 0,
        xp: 0,
        level: 1,
        essaysWritten: 0
      }
    };

    const history = oldData.user.questionHistory || [];
    const schedule = oldData.user.schedule || [];

    // Write New Files
    await ensureDir(DATA_DIR);
    await atomicWrite(FILES.PROFILE, profile);
    await atomicWrite(FILES.HISTORY, history);
    await atomicWrite(FILES.SCHEDULE, schedule);

    // Archive Legacy
    const archivePath = path.join(DATA_DIR, `data-user-migrated-${Date.now()}.txt`);
    await fs.rename(FILES.LEGACY, archivePath);

    console.log('✅ Migration Complete! User "Davi" is ready.');

  } catch (error) {
    console.error('❌ Migration Failed:', error);
  }
}

// --- ENDPOINTS ---

/**
 * GET /api/user/davi/full
 * Loads all data components and combines them for App Init
 */
app.get('/api/user/davi/full', async (req, res) => {
  try {
    await migrateLegacyData();

    const [profile, history, schedule] = await Promise.all([
      readJson(FILES.PROFILE, { stats: { level: 1, xp: 0, questionsAnswered: 0, correctAnswers: 0, currentStreak: 0, essaysWritten: 0 } }),
      readJson(FILES.HISTORY, []),
      readJson(FILES.SCHEDULE, [])
    ]);

    // Reconstruct the "Unified" object for the frontend to consume initially
    const fullData = {
      version: profile.version || '4.0.0',
      lastUpdated: profile.lastUpdated || new Date().toISOString(),
      user: {
        stats: profile.stats,
        questionHistory: history,
        schedule: schedule
      }
    };

    res.json(fullData);
  } catch (error) {
    console.error('Error loading full data:', error);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

/**
 * POST /api/user/davi/profile
 * Updates Stats/XP/Level/Streak
 */
app.post('/api/user/davi/profile', async (req, res) => {
  try {
    const newStats = req.body; // Expects just the stats object or profile object

    // We strictly assume we receive the 'stats' object or a full profile wrapper
    // Let's normalize
    const dataToSave = {
      version: '4.0.0',
      lastUpdated: new Date().toISOString(),
      stats: newStats.stats || newStats // Handle both {stats: {...}} and {...}
    };

    await atomicWrite(FILES.PROFILE, dataToSave);
    res.json({ success: true, lastUpdated: dataToSave.lastUpdated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/davi/history
 * Updates Question History
 */
app.post('/api/user/davi/history', async (req, res) => {
  try {
    const newHistory = req.body; // Expects Array
    if (!Array.isArray(newHistory)) throw new Error('History must be an array');

    await atomicWrite(FILES.HISTORY, newHistory);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/davi/schedule
 * Updates Schedule
 */
app.post('/api/user/davi/schedule', async (req, res) => {
  try {
    const newSchedule = req.body; // Expects Array
    if (!Array.isArray(newSchedule)) throw new Error('Schedule must be an array');

    await atomicWrite(FILES.SCHEDULE, newSchedule);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/davi/interpretation
 * Updates Interpretation History
 */
app.post('/api/user/davi/interpretation', async (req, res) => {
  try {
    const newHistory = req.body;
    if (!Array.isArray(newHistory)) throw new Error('Data must be an array');
    await atomicWrite(FILES.INTERPRETATION, newHistory);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/davi/resolutions
 * Updates Resolutions History
 */
app.post('/api/user/davi/resolutions', async (req, res) => {
  try {
    const data = req.body;
    if (!Array.isArray(data)) throw new Error('Data must be an array');
    await atomicWrite(FILES.RESOLUTIONS, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'Split-File V4', user: 'Davi' });
});

// --- SERVER START ---

app.listen(PORT, () => {
  console.log(`🚀 VestBot Server (V4 Clean-Data) running on port ${PORT}`);
  console.log(`📂 Data Directory: ${DATA_DIR}`);
});
