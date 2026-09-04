
import { Request, Response } from 'express';
import { processClientSheet, processResearchSheet, processHoldingsSheet, processBulkPortfolios } from '../services/upload.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const uploadClients = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const result = await processClientSheet(req.file.buffer);
  res.json({ message: 'Client file imported successfully!', ...result });
});

export const uploadResearch = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const result = await processResearchSheet(req.file.buffer);
  res.json({ message: 'Research file imported successfully!', ...result });
});

export const uploadHoldings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const result = await processHoldingsSheet(req.file.buffer);
  res.json({ message: `Successfully cleared old data and inserted ${result.rowsInserted} live holding records.` });
});
export const uploadBulkPortfolios = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new AppError('No files uploaded', 400);
  
  const results = await processBulkPortfolios(files);
  res.json({ message: 'Bulk processing completed', results });
});
