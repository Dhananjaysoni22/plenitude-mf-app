import cron from 'node-cron';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This cron job will run every 3 hours
// "0 */3 * * *"
export const initCronJobs = () => {
  console.log('Initializing cron jobs. Running an immediate drawdown scrape...');
  
  // Run once immediately on server startup to catch up
  runDrawdownScrape();

  // Then schedule to run every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    console.log('Running 3-hourly Drawdown scrape job...');
    await runDrawdownScrape();
  });
};

export const runDrawdownScrape = async () => {
  try {
    // We fetch the NIFTY 50 (^NSEI) data from Yahoo Finance API
    // We want the 52-week high to calculate the drawdown
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/^NSEI?range=1y&interval=1d');
    const result = response.data.chart.result[0];
    const quotes = result.indicators.quote[0];
    
    // Find the 52-week high from the high array
    let maxHigh = 0;
    for (let i = 0; i < quotes.high.length; i++) {
      if (quotes.high[i] > maxHigh) {
        maxHigh = quotes.high[i];
      }
    }

    // Get current price
    const currentPrice = result.meta.regularMarketPrice;

    // Calculate drawdown
    let drawdown = 0;
    if (maxHigh > 0 && currentPrice < maxHigh) {
      drawdown = ((maxHigh - currentPrice) / maxHigh) * 100;
    }

    console.log(`NIFTY 50 | Peak: ${maxHigh} | Current: ${currentPrice} | Drawdown: ${drawdown.toFixed(2)}%`);

    // Insert into MarketHistory (Date truncated to Midnight to ensure unique per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historyRecord = await prisma.marketHistory.upsert({
      where: {
        date_indexName: {
          date: today,
          indexName: 'NIFTY 50'
        }
      },
      update: {
        price: currentPrice,
        peakPrice: maxHigh,
        drawdown: drawdown
      },
      create: {
        date: today,
        indexName: 'NIFTY 50',
        price: currentPrice,
        peakPrice: maxHigh,
        drawdown: drawdown
      }
    });

    // Update the SystemSettings
    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: { currentDrawdown: drawdown },
      create: { id: 'default', currentDrawdown: drawdown }
    });

    // Generate alerts based on the new drawdown
    const { generateDrawdownNotifications } = require('../services/notification.service');
    const dCount = await generateDrawdownNotifications();
    console.log(`Generated ${dCount} new drawdown alerts.`);

  } catch (err) {
    console.error('Error in drawdown scrape cron:', err);
  }
};
