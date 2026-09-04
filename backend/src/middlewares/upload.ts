import multer from 'multer';

// Use memory storage so we can parse buffer directly with xlsx/csv-parser without saving to disk
const storage = multer.memoryStorage();

export const upload = multer({ storage });
