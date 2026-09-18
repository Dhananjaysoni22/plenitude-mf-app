
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
    const rmName = keyRm && row[keyRm] ? String(row[keyRm]).trim() : '';

    let rmId: string | null = null;
    const isRmBlank = !rmName || rmName.toLowerCase() === 'unassigned' || rmName === '-' || rmName.toLowerCase() === 'n/a';
    
    if (!isRmBlank) {
      let rm = await findUserByNameAndRole(rmName, 'RM');
      if (!rm) {
        rm = await createUser({
          name: rmName,
          email: `${rmName.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase()}@plenitude.com`,
          passwordHash: 'defaultpassword',
          role: 'RM'
        });
      }
      rmId = rm.id;
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
      rmId: rmId,
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

    const clientRecord = await upsertClient(pan, clientName, parsedData, { ...parsedData, pan });
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
    const keyGlobalRank = keys.find(k => k.toLowerCase() === 'global_rank' || k.toLowerCase().includes('global rank'));

    if (!keyName || !row[keyName]) continue;

    const fundName = String(row[keyName]).trim();
    
    const parsedData = {
      category: keyCat ? String(row[keyCat]) : null,
      subCategory: keySubCat ? String(row[keySubCat]) : null,
      aum: keyAum ? parseFloat(row[keyAum]) || 0 : null,
      quartile: keyQuartile ? String(row[keyQuartile]) : null,
      selectionPriority: keyPriority ? parseInt(row[keyPriority]) || null : null,
      globalRank: keyGlobalRank ? parseInt(row[keyGlobalRank]) || null : null,
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

    // New AUM Breakdown columns
    const keyDebt = keys.find(k => k.trim().toLowerCase() === 'debt');
    const keyEquity = keys.find(k => k.trim().toLowerCase() === 'equity');
    const keyHybrid = keys.find(k => k.trim().toLowerCase() === 'hybrid');
    const keyLiquid = keys.find(k => k.trim().toLowerCase().includes('liquid'));
    const keyOther = keys.find(k => k.trim().toLowerCase() === 'other');
    const keyArbitrage = keys.find(k => k.trim().toLowerCase().includes('arbitrage'));
    const keyAllocation = keys.find(k => k.trim().toLowerCase().includes('allocation'));

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

    const debt = keyDebt ? parseCurrency(row[keyDebt]) : null;
    const equity = keyEquity ? parseCurrency(row[keyEquity]) : null;
    const hybrid = keyHybrid ? parseCurrency(row[keyHybrid]) : null;
    const liquid = keyLiquid ? parseCurrency(row[keyLiquid]) : null;
    const other = keyOther ? parseCurrency(row[keyOther]) : null;
    const arbitrage = keyArbitrage ? parseCurrency(row[keyArbitrage]) : null;
    const allocation = keyAllocation ? String(row[keyAllocation]).trim() : null;

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

    await prisma.clientHolding.create({
      data: {
        clientId: client.id,
        fundId: researchFundId,
        fundNameRaw: schemeRaw,
        folioNumber: folio,
        debt,
        equity,
        hybrid,
        liquid,
        other,
        arbitrage,
        allocation,
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

    await prisma.holdingHistory.create({
      data: {
        clientId: client.id,
        fundId: researchFundId,
        fundNameRaw: schemeRaw,
        folio: folio,
        debt,
        equity,
        hybrid,
        liquid,
        other,
        arbitrage,
        allocation,
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
             client = await prisma.client.findFirst({ 
               where: { 
                 pan,
                 name: { equals: clientName, mode: 'insensitive' }
               } 
             });
          }
          
          if (!client) {
            client = await prisma.client.findFirst({ where: { name: { equals: clientName, mode: 'insensitive' } } });
          }
          
          if (!client) {
             client = await upsertClient(pan, clientName, { name: clientName, rmId: rm.id }, { name: clientName, rmId: rm.id, pan });
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
               const currentValIdx = headers.findIndex(h => h.includes('current value') || h === 'total');
               const unitsIdx = headers.findIndex(h => h.includes('units'));
               
               const purchaseNavIdx = headers.findIndex(h => h.includes('purchase nav'));
               const purchaseValIdx = headers.findIndex(h => h.includes('purchase value'));
               const currentNavIdx = headers.findIndex(h => h.includes('current nav'));
               const dividendIdx = headers.findIndex(h => h.includes('dividend'));
               const gainIdx = headers.findIndex(h => h === 'gain');
               const holdingDaysIdx = headers.findIndex(h => h.includes('holding days'));
               const absReturnIdx = headers.findIndex(h => h.includes('absolute return'));
               const cagrIdx = headers.findIndex(h => h.includes('cagr'));

               // New AUM Breakdown columns per scheme
               const debtIdx = headers.findIndex(h => h.trim() === 'debt');
               const equityIdx = headers.findIndex(h => h.trim() === 'equity');
               const hybridIdx = headers.findIndex(h => h.trim() === 'hybrid');
               const liquidIdx = headers.findIndex(h => h.trim().includes('liquid'));
               const otherIdx = headers.findIndex(h => h.trim() === 'other');
               const arbitrageIdx = headers.findIndex(h => h.trim().includes('arbitrage'));
               const allocationIdx = headers.findIndex(h => h.trim().includes('allocation'));

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

               const debt = debtIdx > -1 ? parseCurrency(row[debtIdx]) : null;
               const equity = equityIdx > -1 ? parseCurrency(row[equityIdx]) : null;
               const hybrid = hybridIdx > -1 ? parseCurrency(row[hybridIdx]) : null;
               const liquid = liquidIdx > -1 ? parseCurrency(row[liquidIdx]) : null;
               const other = otherIdx > -1 ? parseCurrency(row[otherIdx]) : null;
               const arbitrage = arbitrageIdx > -1 ? parseCurrency(row[arbitrageIdx]) : null;
               const allocation = allocationIdx > -1 ? String(row[allocationIdx]).trim() : null;

             let researchFundId = null;
             const researchFund = await findResearchFundByName(schemeRaw);
             if (researchFund) {
               researchFundId = researchFund.id;
             } else {
               const mappingRule = await getMappingRule(schemeRaw);
               if (mappingRule) researchFundId = mappingRule.researchFundId;
             }

             if (clientId) {
               const holding = await prisma.clientHolding.create({
                 data: {
                    clientId,
                    fundId: researchFundId,
                    fundNameRaw: schemeRaw,
                    folioNumber: folio,
                    debt,
                    equity,
                    hybrid,
                    liquid,
                    other,
                    arbitrage,
                    allocation,
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

               await prisma.holdingHistory.create({
                  data: {
                    clientId,
                    fundId: researchFundId,
                    fundNameRaw: schemeRaw,
                    folio,
                    debt,
                    equity,
                    hybrid,
                    liquid,
                    other,
                    arbitrage,
                    allocation,
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

export const processMasterReport = async (buffer: Buffer) => {
  if (!buffer) throw new AppError('Buffer is required', 400);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  // 1. Locate the two sheets dynamically
  let clientSheetName = workbook.SheetNames.find(s => 
    s.toUpperCase().includes('CLIENT')
  );
  let holdingsSheetName = workbook.SheetNames.find(s => 
    s.toUpperCase().includes('HOLDING') || s.toUpperCase().includes('SCHEME')
  );

  // Fallback by inspecting headers if sheet names differ
  if (!clientSheetName || !holdingsSheetName) {
    for (const name of workbook.SheetNames) {
      const sample = xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }) as any[][];
      const headerStr = (sample[0] || []).join(' ').toLowerCase();
      if (headerStr.includes('folio') && headerStr.includes('scheme')) {
        holdingsSheetName = name;
      } else if (headerStr.includes('portfolio') || headerStr.includes('client')) {
        clientSheetName = name;
      }
    }
  }

  if (!clientSheetName || !holdingsSheetName || clientSheetName === holdingsSheetName) {
    throw new AppError('Master Excel report must contain both CLIENT_MASTER and MASTER_ALL_HOLDINGS sheets.', 400);
  }

  const clientRows = xlsx.utils.sheet_to_json(workbook.Sheets[clientSheetName]) as any[];
  const holdingsRows = xlsx.utils.sheet_to_json(workbook.Sheets[holdingsSheetName]) as any[];

  // 2. Cache existing RMs for O(1) matching
  const existingRms = await prisma.user.findMany({ where: { role: 'RM' } });
  const rmMap = new Map<string, string>();
  existingRms.forEach(u => rmMap.set(u.name.trim().toLowerCase(), u.id));

  const panToClientIdMap = new Map<string, string>();
  const nameToClientIdMap = new Map<string, string>();

  let clientsUpserted = 0;
  let rmsCreated = 0;
  let unassignedClients = 0;

  // 3. Process CLIENT_MASTER sheet
  for (const row of clientRows) {
    const keys = Object.keys(row);
    const keyClientName = keys.find(k => k.trim().toLowerCase().includes('client name') || k.trim().toLowerCase() === 'client');
    const keyPan = keys.find(k => k.trim().toLowerCase() === 'pan' || k.trim().toLowerCase().includes('pan'));
    const keyRm = keys.find(k => k.trim().toLowerCase().includes('relationship manager') || k.trim().toLowerCase() === 'rm');

    if (!keyClientName || !row[keyClientName]) continue;

    const clientName = String(row[keyClientName]).trim();
    const pan = keyPan && row[keyPan] ? String(row[keyPan]).trim().toUpperCase() : `UNKNOWN_${Math.random()}`;
    const rmRaw = keyRm && row[keyRm] ? String(row[keyRm]).trim() : '';

    let rmId: string | null = null;
    const isRmBlank = !rmRaw || rmRaw.toLowerCase() === 'unassigned' || rmRaw === '-' || rmRaw.toLowerCase() === 'n/a';

    if (!isRmBlank) {
      const lowerRm = rmRaw.toLowerCase();
      if (rmMap.has(lowerRm)) {
        rmId = rmMap.get(lowerRm)!;
      } else {
        const cleanName = rmRaw.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase();
        const newRm = await createUser({
          name: rmRaw,
          email: `${cleanName}@plenitude.com`,
          passwordHash: 'defaultpassword',
          role: 'RM'
        });
        rmId = newRm.id;
        rmMap.set(lowerRm, rmId);
        rmsCreated++;
      }
    } else {
      unassignedClients++;
    }

    const keyFamilyHead = keys.find(k => k.trim().toLowerCase().includes('family head'));
    const keyTotal = keys.find(k => k.trim().toLowerCase().includes('total portfolio aum') || k.trim().toLowerCase() === 'total' || k.trim().toLowerCase().includes('total aum'));
    const keyEquity = keys.find(k => k.trim().toLowerCase().includes('equity aum') || k.trim().toLowerCase() === 'equity');
    const keyDebt = keys.find(k => k.trim().toLowerCase().includes('debt aum') || k.trim().toLowerCase() === 'debt');
    const keyHybrid = keys.find(k => k.trim().toLowerCase().includes('hybrid aum') || k.trim().toLowerCase() === 'hybrid');
    const keyUnits = keys.find(k => k.trim().toLowerCase().includes('total units') || k.trim().toLowerCase() === 'units');

    const parsedClient = {
      name: clientName,
      rmId: rmId,
      familyHead: keyFamilyHead && row[keyFamilyHead] ? String(row[keyFamilyHead]).trim() : null,
      totalAum: parseCurrency(row[keyTotal || '']),
      equityAum: parseCurrency(row[keyEquity || '']),
      debtAum: parseCurrency(row[keyDebt || '']),
      hybridAum: parseCurrency(row[keyHybrid || '']),
      totalUnits: parseCurrency(row[keyUnits || '']),
    };

    const clientRecord = await upsertClient(pan, clientName, parsedClient, { ...parsedClient, pan });

    panToClientIdMap.set(pan, clientRecord.id);
    nameToClientIdMap.set(clientName.toLowerCase(), clientRecord.id);

    await prisma.clientHistory.create({
      data: {
        clientId: clientRecord.id,
        totalAum: parsedClient.totalAum,
        equityAum: parsedClient.equityAum,
        debtAum: parsedClient.debtAum,
        hybridAum: parsedClient.hybridAum,
        totalUnits: parsedClient.totalUnits
      }
    });

    clientsUpserted++;
  }

  // 4. Pre-fetch Mapping Rules and Research Funds into memory maps
  const allMappingRules = await prisma.fundMappingRule.findMany();
  const ruleMap = new Map<string, string>();
  allMappingRules.forEach(r => ruleMap.set(r.rawName.trim().toLowerCase(), r.researchFundId));

  const allResearchFunds = await prisma.researchFund.findMany({ select: { id: true, name: true } });
  const researchFundMap = new Map<string, string>();
  allResearchFunds.forEach(rf => researchFundMap.set(rf.name.trim().toLowerCase(), rf.id));

  // 5. Process MASTER_ALL_HOLDINGS sheet
  const holdingsToInsert: any[] = [];
  const historyToInsert: any[] = [];

  for (const row of holdingsRows) {
    const keys = Object.keys(row);
    const keyPan = keys.find(k => k.trim().toLowerCase() === 'pan');
    const keyClientName = keys.find(k => k.trim().toLowerCase().includes('client name') || k.trim().toLowerCase() === 'client');
    const keyScheme = keys.find(k => k.trim().toLowerCase().includes('scheme name') || k.trim().toLowerCase() === 'scheme' || k.trim().toLowerCase().includes('fund'));

    if (!keyScheme || !row[keyScheme]) continue;

    const schemeRaw = String(row[keyScheme]).trim();
    const panRaw = keyPan && row[keyPan] ? String(row[keyPan]).trim().toUpperCase() : '';
    const nameRaw = keyClientName && row[keyClientName] ? String(row[keyClientName]).trim().toLowerCase() : '';

    let clientId = panToClientIdMap.get(panRaw);
    if (!clientId && nameRaw) {
      clientId = nameToClientIdMap.get(nameRaw);
    }
    if (!clientId) continue;

    const keyFolio = keys.find(k => k.trim().toLowerCase().includes('folio'));
    const keyTotalAum = keys.find(k => k.trim().toLowerCase().includes('total aum') || k.trim().toLowerCase().includes('current value') || k.trim().toLowerCase() === 'total');
    const keyEquity = keys.find(k => k.trim().toLowerCase() === 'equity (rs)' || k.trim().toLowerCase() === 'equity');
    const keyDebt = keys.find(k => k.trim().toLowerCase() === 'debt (rs)' || k.trim().toLowerCase() === 'debt');
    const keyHybrid = keys.find(k => k.trim().toLowerCase() === 'hybrid (rs)' || k.trim().toLowerCase() === 'hybrid');
    const keyLiquid = keys.find(k => k.trim().toLowerCase().includes('liquid'));
    const keyArbitrage = keys.find(k => k.trim().toLowerCase().includes('arbitrage'));
    const keyOther = keys.find(k => k.trim().toLowerCase().includes('other'));
    const keyUnits = keys.find(k => k.trim().toLowerCase() === 'units' || k.trim().toLowerCase().includes('units'));
    const keyAlloc = keys.find(k => k.trim().toLowerCase().includes('allocation'));

    const folio = keyFolio && row[keyFolio] ? String(row[keyFolio]).trim() : undefined;
    const currentValue = parseCurrency(row[keyTotalAum || '']);
    const equity = keyEquity ? parseCurrency(row[keyEquity]) : null;
    const debt = keyDebt ? parseCurrency(row[keyDebt]) : null;
    const hybrid = keyHybrid ? parseCurrency(row[keyHybrid]) : null;
    const liquid = keyLiquid ? parseCurrency(row[keyLiquid]) : null;
    const arbitrage = keyArbitrage ? parseCurrency(row[keyArbitrage]) : null;
    const other = keyOther ? parseCurrency(row[keyOther]) : null;
    const units = keyUnits ? parseCurrency(row[keyUnits]) : null;
    const allocation = keyAlloc && row[keyAlloc] !== undefined ? String(row[keyAlloc]).trim() : null;

    let researchFundId: string | null = null;
    const lowerScheme = schemeRaw.toLowerCase();
    if (ruleMap.has(lowerScheme)) {
      researchFundId = ruleMap.get(lowerScheme)!;
    } else if (researchFundMap.has(lowerScheme)) {
      researchFundId = researchFundMap.get(lowerScheme)!;
    }

    const holdingRecord = {
      clientId,
      fundId: researchFundId,
      fundNameRaw: schemeRaw,
      folioNumber: folio,
      currentValue,
      equity,
      debt,
      hybrid,
      liquid,
      arbitrage,
      other,
      units,
      allocation
    };

    holdingsToInsert.push(holdingRecord);
    historyToInsert.push({
      clientId,
      fundId: researchFundId,
      fundNameRaw: schemeRaw,
      folio: folio,
      currentValue,
      equity,
      debt,
      hybrid,
      liquid,
      arbitrage,
      other,
      units,
      allocation
    });
  }

  // 6. Delete old live holdings and batch-insert
  await deleteHoldings();

  const chunkSize = 2000;
  for (let i = 0; i < holdingsToInsert.length; i += chunkSize) {
    const chunk = holdingsToInsert.slice(i, i + chunkSize);
    await prisma.clientHolding.createMany({ data: chunk });
  }

  for (let i = 0; i < historyToInsert.length; i += chunkSize) {
    const chunk = historyToInsert.slice(i, i + chunkSize);
    await prisma.holdingHistory.createMany({ data: chunk });
  }

  return {
    clientsUpserted,
    holdingsInserted: holdingsToInsert.length,
    rmsCreated,
    unassignedClients
  };
};
