import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express from 'express';
import { Telegraf } from 'telegraf';
import { GoogleGenAI, Type } from '@google/genai';
import puppeteer from 'puppeteer';

// Express setup (useful if we want to add an explicit webhook later)
const app = express();
const port = process.env.PORT || 3001;

// Initialize clients
const bot = new Telegraf(process.env.telegram_token || '');
const ai = new GoogleGenAI({ apiKey: process.env.gemini_API });

// Setup Gemini Schema
const invoiceSchema = {
    type: Type.OBJECT,
    properties: {
        buyer_name: { type: Type.STRING },
        buyer_address: { type: Type.STRING },
        buyer_gst_number: { type: Type.STRING },
        buyer_state_name: { type: Type.STRING },
        place_of_supply: { type: Type.STRING },
        product_name: { type: Type.STRING },
        duration: { type: Type.STRING },
        service_fee: { type: Type.NUMBER }
    },
    required: ["buyer_name", "product_name", "service_fee"],
};

// Formatter utility
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

// Helper: AI Extraction
async function extractInvoiceData(text) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract invoice information from the following text based on the schema requirements:\n\n${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: invoiceSchema,
                temperature: 0.1
            }
        });

        const jsonString = response.text || "{}";
        const data = JSON.parse(jsonString);

        if (!data.buyer_name || !data.product_name || data.service_fee === undefined) {
            return { error: 'Missing required fields: buyer_name, product_name, or service_fee.' };
        }

        if (isNaN(data.service_fee)) {
            return { error: 'Invalid service fee. Please enter numeric value.' };
        }

        return { data };
    } catch (error) {
        console.error("AI Extraction Error:", error);
        return { error: 'Failed to extract data correctly. Please try again.' };
    }
}

// Telegram Bot Logic
bot.start((ctx) => ctx.reply('Send me an invoice detail message to generate a PDF!'));

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const chatId = ctx.chat.id;

    // Status message
    const msg = await ctx.reply('🔄 Extracting data with Gemini...');

    // 1. Extract Data
    const { data: extractedData, error } = await extractInvoiceData(text);

    if (error) {
        return ctx.telegram.editMessageText(chatId, msg.message_id, undefined, `❌ Error: ${error}`);
    }

    await ctx.telegram.editMessageText(chatId, msg.message_id, undefined, '🧮 Calculating totals...');

    // 2. Deterministic Calculation
    const gst_rate = 18;
    const serviceFee = Number(extractedData.service_fee);
    const gstAmount = Number((serviceFee * (gst_rate / 100)).toFixed(2));
    const totalAmount = Number((serviceFee + gstAmount).toFixed(2));

    // Provide default date
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Build Payload
    const payload = {
        ...extractedData,
        gst_rate,
        service_fee_formatted: formatCurrency(serviceFee),
        gst_amount_formatted: formatCurrency(gstAmount),
        price_formatted: formatCurrency(totalAmount),
        total_amount_formatted: formatCurrency(totalAmount),
        invoice_date: invoiceDate
    };

    await ctx.telegram.editMessageText(chatId, msg.message_id, undefined, '📄 Generating PDF Invoice...');

    // 3. Generate PDF via React + Puppeteer
    let browser;
    try {
        const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64');
        const targetUrl = `http://localhost:3000/?data=${encodeURIComponent(encodedData)}`;

        browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Emulate screen for CSS rendering (like styles.css)
        await page.emulateMediaType('screen');

        await page.goto(targetUrl, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });

        // Send PDF back via Telegram
        await ctx.telegram.editMessageText(chatId, msg.message_id, undefined, '✅ Invoice Generated successfully!');
        await ctx.replyWithDocument({
            source: Buffer.from(pdfBuffer),
            filename: `Invoice_${extractedData.buyer_name || 'Client'}.pdf`
        });

    } catch (pdfError) {
        console.error("PDF Generation Error:", pdfError);
        await ctx.telegram.editMessageText(chatId, msg.message_id, undefined, '❌ Error: Failed to generate PDF. Make sure the React frontend is running on port 3000.');
    } finally {
        if (browser) await browser.close();
    }
});

// Start Express and Bot
app.listen(port, () => {
    console.log(`[Express] Server listening on port ${port}`);
    bot.launch();
    console.log(`[Telegram] Bot started (polling)`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
