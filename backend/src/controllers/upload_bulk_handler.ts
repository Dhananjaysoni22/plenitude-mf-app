export const uploadBulkPortfolios = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new AppError('No files uploaded', 400);
  
  const results = await processBulkPortfolios(files);
  res.json({ message: 'Bulk processing completed', results });
});
