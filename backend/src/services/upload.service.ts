
import * as xlsx from 'xlsx';
import { findUserByNameAndRole, createUser } from '../dal/user.dal';
import { upsertClient } from '../dal/client.dal';
import { upsertResearchFund, findResearchFundByName } from '../dal/research.dal';
import { deleteHoldings, createHolding, getMappingRule } from '../dal/holding.dal';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const parseCurrency = (val: any) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[₹, ]/g, '');
  return parseFloat(cleaned) || 0;
};

export const processClientSheet = async (buffer: Buffer) => {
  if (!buffer) throw new AppError('Buffer is required', 400);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

  let clientsInserted = 0;
  for (const row of data) {
    const keys = Object.keys(row);
    const keyClientName = keys.find(k => k.toLowerCase().includes('client name') || k.toLowerCase() === 'client');
    const keyPan = keys.find(k => k.toLowerCase() === 'pan' || k.toLowerCase().includes('pan'));
    const keyRm = keys.find(k => k.toLowerCase().includes('relationship manager') || k.toLowerCase() === 'rm');
    
    if (!keyClientName || !row[keyClientName]) continue;

    const clientName = String(row[keyClientName]).trim();
    const pan = keyPan ? String(row[keyPan]).trim() : `UNKNOWN_${Math.random()}`;
    const rmName = keyRm ? String(row[keyRm]).trim() : 'Unassigned';

    let rm = await findUserByNameAndRole(rmName, 'RM');
    if (!rm) {
      rm = await createUser({
        name: rmName,
        email: `${rmName.replace(/\s+/g, '.').toLowerCase()}@plenitude.com`,
        passwordHash: 'defaultpassword',
        role: 'RM'
      });
    }

    const keyTotal = keys.find(k => k.toLowerCase() === 'total' || k.toLowerCase().includes('total aum'));
    const keyEquity = keys.find(k => k.toLowerCase().includes('equity'));
    const keyDebt = keys.find(k => k.toLowerCase().includes('debt'));
    const keyHybrid = keys.find(k => k.toLowerCase().includes('hybrid'));
    const keyFamilyHead = keys.find(k => k.toLowerCase().includes('family head'));
    const keyUnits = keys.find(k => k.toLowerCase().includes('units'));

    // New Fields
    const keyInvested = keys.find(k => k.toLowerCase().includes('purchase value') || k.toLowerCase().includes('invested'));
    const keyGain = keys.find(k => k.toLowerCase() === 'gain' || k.toLowerCase() === 'total gain');
    const keyCagr = keys.find(k => k.toLowerCase() === 'cagr');
    const keyAbsReturn = keys.find(k => k.toLowerCase().includes('absolute return'));

    const parsedData = {
      name: clientName,
      rmId: rm.id,
      totalAum: parseCurrency(row[keyTotal || '']),
      equityAum: parseCurrency(row[keyEquity || '']),
      debtAum: parseCurrency(row[keyDebt || '']),
      hybridAum: parseCurrency(row[keyHybrid || '']),
      familyHead: keyFamilyHead ? String(row[keyFamilyHead]) : null,
      totalUnits: parseCurrency(row[keyUnits || '']),
      totalInvested: keyInvested ? parseCurrency(row[keyInvested]) : null,
      totalGain: keyGain ? parseCurrency(row[keyGain]) : null,
      overallCagr: keyCagr ? parseCurrency(row[keyCagr]) : null,
      overallAbsoluteReturn: keyAbsReturn ? parseCurrency(row[keyAbsReturn]) : null
    };

    const clientRecord = await upsertClient(pan, parsedData, { ...parsedData, pan });
    await prisma.clientHistory.create({
      data: {
        clientId: clientRecord.id,
        totalAum: parsedData.totalAum,
        equityAum: parsedData.equityAum,
        debtAum: parsedData.debtAum,
        hybridAum: parsedData.hybridAum,
        totalUnits: parsedData.totalUnits,
        totalInvested: parsedData.totalInvested,
        totalGain: parsedData.totalGain,
        overallCagr: parsedData.overallCagr,
        overallAbsoluteReturn: parsedData.overallAbsoluteReturn
      }
    });
    clientsInserted++;
  }
  return { rowsParsed: data.length, rowsInserted: clientsInserted };
};

export const processResearchSheet = async (buffer: Buffer) => {
  if (!buffer) throw new AppError('Buffer is required', 400);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

  let inserted = 0;
  for (const row of data) {
    const keys = Object.keys(row);
    const keyName = keys.find(k => k.toLowerCase().includes('name'));
    const keyCat = keys.find(k => k.toLowerCase() === 'category' || k.toLowerCase().includes('category'));
    const keySubCat = keys.find(k => k.toLowerCase() === 'sub-category' || k.toLowerCase().includes('sub'));
    const keyAum = keys.find(k => k.toLowerCase() === 'aum');
    const keyQuartile = keys.find(k => k.toLowerCase().includes('quartile'));
    const keyPriority = keys.find(k => k.toLowerCase().includes('priority'));

    if (!keyName || !row[keyName]) continue;

    const fundName = String(row[keyName]).trim();
    
    const parsedData = {
      category: keyCat ? String(row[keyCat]) : null,
      subCategory: keySubCat ? String(row[keySubCat]) : null,
      aum: keyAum ? parseFloat(row[keyAum]) || 0 : null,
      quartile: keyQuartile ? String(row[keyQuartile]) : null,
      selectionPriority: keyPriority ? parseInt(row[keyPriority]) || null : null,
    };

    await upsertResearchFund(fundName, parsedData, { ...parsedData, name: fundName });
    inserted++;
  }
  return { rowsParsed: data.length, rowsInserted: inserted };
};

export const processHoldingsSheet = async (buffer: Buffer) => {
  if (!buffer) throw new AppError('Buffer is required', 400);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

  await deleteHoldings();
  let holdingsInserted = 0;

  for (const row of data) {
    const keys = Object.keys(row);
    const keyClientName = keys.find(k => k.toLowerCase().includes('client name') || k.toLowerCase() === 'client');
    const keyFolio = keys.find(k => k.toLowerCase().includes('folio'));
    const keyScheme = keys.find(k => k.toLowerCase().includes('scheme name') || k.toLowerCase().includes('fund') || k.toLowerCase() === 'scheme');
    const keyCurrentValue = keys.find(k => k.toLowerCase().includes('current value') || k.toLowerCase().includes('total'));
    const keyUnits = keys.find(k => k.toLowerCase().includes('units'));

    // New Fields
    const keyPurchaseNav = keys.find(k => k.toLowerCase().includes('purchase nav'));
    const keyPurchaseValue = keys.find(k => k.toLowerCase().includes('purchase value'));
    const keyCurrentNav = keys.find(k => k.toLowerCase().includes('current nav'));
    const keyDividend = keys.find(k => k.toLowerCase().includes('dividend'));
    const keyGain = keys.find(k => k.toLowerCase() === 'gain');
    const keyHoldingDays = keys.find(k => k.toLowerCase().includes('holding days'));
    const keyAbsReturn = keys.find(k => k.toLowerCase().includes('absolute return'));
    const keyCagr = keys.find(k => k.toLowerCase().includes('cagr'));

    if (!keyClientName || !keyScheme) continue;

    const clientNameRaw = String(row[keyClientName]).trim();
    const schemeRaw = String(row[keyScheme]).trim();
    const folio = keyFolio ? String(row[keyFolio]).trim() : undefined;
    const currentValue = parseCurrency(row[keyCurrentValue || '']);
    const units = parseCurrency(row[keyUnits || '']);
    
    const purchaseNav = keyPurchaseNav ? parseCurrency(row[keyPurchaseNav]) : null;
    const investedAmount = keyPurchaseValue ? parseCurrency(row[keyPurchaseValue]) : null;
    const currentNav = keyCurrentNav ? parseCurrency(row[keyCurrentNav]) : null;
    const dividend = keyDividend ? parseCurrency(row[keyDividend]) : null;
    const gain = keyGain ? parseCurrency(row[keyGain]) : null;
    const holdingDays = keyHoldingDays ? parseInt(row[keyHoldingDays]) || null : null;
    const absoluteReturn = keyAbsReturn ? parseCurrency(row[keyAbsReturn]) : null;
    const cagr = keyCagr ? parseCurrency(row[keyCagr]) : null;

    if (!clientNameRaw || !schemeRaw) continue;

    const client = await prisma.client.findFirst({
      where: { name: { equals: clientNameRaw, mode: 'insensitive' } }
    });
    if (!client) continue;

    let researchFundId = null;
    const researchFund = await findResearchFundByName(schemeRaw);
    
    if (researchFund) {
      researchFundId = researchFund.id;
    } else {
      const mappingRule = await getMappingRule(schemeRaw);
      if (mappingRule) researchFundId = mappingRule.researchFundId;
    }

    await createHolding({
      clientId: client.id,
      fundId: researchFundId,
      fundNameRaw: schemeRaw,
      folioNumber: folio,
      currentValue: currentValue,
      units: units,
      investedAmount,
      purchaseNav,
      currentNav,
      dividend,
      gain,
      holdingDays,
      absoluteReturn,
      cagr
    });

    await prisma.holdingHistory.create({
      data: {
        clientId: client.id,
        fundId: researchFundId,
        fundNameRaw: schemeRaw,
        folio: folio,
        currentValue: currentValue,
        units: units,
        investedAmount,
        purchaseNav,
        currentNav,
        dividend,
        gain,
        holdingDays,
        absoluteReturn,
        cagr
      }
    });

    holdingsInserted++;
  }
  return { rowsParsed: data.length, rowsInserted: holdingsInserted };
};
export const processBulkPortfolios = async (files: Express.Multer.File[]) => {
  const results = [];
  
  for (const file of files) {
    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];

      let clientName = '';
      let rmName = 'Unassigned';
      let parsingState = 'SEARCHING_HEADER'; 
      let headers: string[] = [];
      let holdingsCount = 0;
      
      let totalInvested = 0;
      let totalCurrent = 0;
      let totalGain = 0;
      let overallCagr = 0;
      let overallAbsReturn = 0;

      let clientId = '';

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rowStr = row.join(' ').trim();
        if (rowStr.includes('Client:') && rowStr.includes('Relationship Manager:')) {
          const cMatch = rowStr.match(/Client:\s*(.*?)\s*(Relationship Manager:|$)/i);
          const rMatch = rowStr.match(/Relationship Manager:\s*(.*?)\s*(Report printed|$)/i);
          
          let pan = `UNKNOWN_${Math.random()}`;
          
          if (cMatch && cMatch[1]) {
            let rawClientStr = cMatch[1].trim();
            const panMatch = rawClientStr.match(/^(.*?)\s*\((.*?)\)$/);
            if (panMatch) {
              clientName = panMatch[1].trim();
              pan = panMatch[2].trim();
            } else {
              clientName = rawClientStr;
            }
          }
          
          if (rMatch && rMatch[1]) rmName = rMatch[1].trim();

          let rm = await findUserByNameAndRole(rmName, 'RM');
          if (!rm) {
            rm = await createUser({
              name: rmName,
              email: `${rmName.replace(/\s+/g, '.').toLowerCase()}@plenitude.com`,
              passwordHash: 'defaultpassword',
              role: 'RM'
            });
          }

          let client = null;
          if (!pan.startsWith('UNKNOWN_')) {
             client = await prisma.client.findUnique({ where: { pan } });
          }
          
          if (!client) {
            client = await prisma.client.findFirst({ where: { name: { equals: clientName, mode: 'insensitive' } } });
          }
          
          if (!client) {
             client = await upsertClient(pan, { name: clientName, rmId: rm.id }, { name: clientName, rmId: rm.id, pan });
          }
          clientId = client.id;

          await prisma.clientHolding.deleteMany({ where: { clientId: client.id } });
        }
        else if (rowStr.includes('SCHEME') && rowStr.includes('FOLIO NO')) {
           headers = row.map(h => String(h || '').trim().toLowerCase());
           parsingState = 'PARSING_FUNDS';
        }
        else if (parsingState === 'PARSING_FUNDS') {
           if (rowStr.includes('Grand Total')) {
             const keyInvested = headers.findIndex(h => h.includes('purchase value') || h.includes('invested'));
             const keyCurrent = headers.findIndex(h => h.includes('current value'));
             const keyGain = headers.findIndex(h => h === 'gain' || h === 'total gain');
             const keyCagr = headers.findIndex(h => h === 'cagr' || h === 'cagr (%)');
             const keyAbs = headers.findIndex(h => h.includes('absolute return'));

             if (keyInvested > -1) totalInvested = parseCurrency(row[keyInvested]);
             if (keyCurrent > -1) totalCurrent = parseCurrency(row[keyCurrent]);
             if (keyGain > -1) totalGain = parseCurrency(row[keyGain]);
             if (keyCagr > -1) overallCagr = parseCurrency(row[keyCagr]);
             if (keyAbs > -1) overallAbsReturn = parseCurrency(row[keyAbs]);

             if (clientId) {
                await prisma.client.update({
                  where: { id: clientId },
                  data: {
                    totalAum: totalCurrent,
                    totalInvested,
                    totalGain,
                    overallCagr,
                    overallAbsoluteReturn: overallAbsReturn
                  }
                });
                await prisma.clientHistory.create({
                  data: {
                    clientId: clientId,
                    totalAum: totalCurrent,
                    equityAum: 0,
                    debtAum: 0,
                    hybridAum: 0,
                    totalInvested,
                    totalGain,
                    overallCagr,
                    overallAbsoluteReturn: overallAbsReturn
                  }
                });
             }
           }
           else if (rowStr.includes('Total') || rowStr === 'Equity' || rowStr === 'Debt') {
             continue;
           }
           else {
               const schemeIdx = headers.findIndex(h => h.includes('scheme'));
               const folioIdx = headers.findIndex(h => h.includes('folio'));
               const currentValIdx = headers.findIndex(h => h.includes('current value'));
               const unitsIdx = headers.findIndex(h => h.includes('units'));
               
               const purchaseNavIdx = headers.findIndex(h => h.includes('purchase nav'));
               const purchaseValIdx = headers.findIndex(h => h.includes('purchase value'));
               const currentNavIdx = headers.findIndex(h => h.includes('current nav'));
               const dividendIdx = headers.findIndex(h => h.includes('dividend'));
               const gainIdx = headers.findIndex(h => h === 'gain');
               const holdingDaysIdx = headers.findIndex(h => h.includes('holding days'));
               const absReturnIdx = headers.findIndex(h => h.includes('absolute return'));
               const cagrIdx = headers.findIndex(h => h.includes('cagr'));

               if (schemeIdx === -1 || !row[schemeIdx]) continue;

               const schemeRaw = String(row[schemeIdx]).trim();
               const folio = folioIdx > -1 ? String(row[folioIdx]).trim() : undefined;
               const currentValue = currentValIdx > -1 ? parseCurrency(row[currentValIdx]) : 0;
               const units = unitsIdx > -1 ? parseCurrency(row[unitsIdx]) : 0;
               
               // Ignore category headers or repeated client names
               if (currentValue === 0 && units === 0 && !folio) continue;
               if (schemeRaw.toLowerCase().includes(clientName.toLowerCase())) continue;

               const purchaseNav = purchaseNavIdx > -1 ? parseCurrency(row[purchaseNavIdx]) : null;
               const investedAmount = purchaseValIdx > -1 ? parseCurrency(row[purchaseValIdx]) : null;
               const currentNav = currentNavIdx > -1 ? parseCurrency(row[currentNavIdx]) : null;
               const dividend = dividendIdx > -1 ? parseCurrency(row[dividendIdx]) : null;
               const gain = gainIdx > -1 ? parseCurrency(row[gainIdx]) : null;
               const holdingDays = holdingDaysIdx > -1 ? parseInt(row[holdingDaysIdx]) || null : null;
               const absoluteReturn = absReturnIdx > -1 ? parseCurrency(row[absReturnIdx]) : null;
               const cagr = cagrIdx > -1 ? parseCurrency(row[cagrIdx]) : null;

             let researchFundId = null;
             const researchFund = await findResearchFundByName(schemeRaw);
             if (researchFund) {
               researchFundId = researchFund.id;
             } else {
               const mappingRule = await getMappingRule(schemeRaw);
               if (mappingRule) researchFundId = mappingRule.researchFundId;
             }

             if (clientId) {
               await createHolding({
                  clientId,
                  fundId: researchFundId,
                  fundNameRaw: schemeRaw,
                  folioNumber: folio,
                  currentValue,
                  units,
                  investedAmount,
                  purchaseNav,
                  currentNav,
                  dividend,
                  gain,
                  holdingDays,
                  absoluteReturn,
                  cagr
               });

               await prisma.holdingHistory.create({
                  data: {
                    clientId,
                    fundId: researchFundId,
                    fundNameRaw: schemeRaw,
                    folio,
                    currentValue,
                    units,
                    investedAmount,
                    purchaseNav,
                    currentNav,
                    dividend,
                    gain,
                    holdingDays,
                    absoluteReturn,
                    cagr
                  }
               });
               holdingsCount++;
             }
           }
        }
      }

      if (clientName && holdingsCount > 0) {
        results.push({ filename: file.originalname, status: 'SUCCESS', clientName, holdingsInserted: holdingsCount, error: null });
      } else {
        results.push({ filename: file.originalname, status: 'FAILED', clientName: clientName || 'Unknown', holdingsInserted: 0, error: 'Could not parse format or zero holdings found.' });
      }
    } catch (e: any) {
      console.error(e);
      results.push({ filename: file.originalname, status: 'FAILED', clientName: 'Unknown', holdingsInserted: 0, error: e.message });
    }
  }
  
  return results;
};
