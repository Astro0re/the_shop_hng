import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.APP_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '20kb' }));

function isProjectRoot(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

const ready = Boolean(isProjectRoot(process.env.SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase'));
const admin = ready ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const mailgunApiKey = process.env.MAILGUN_API_KEY || process.env.API_KEY;
const mailgunReady = Boolean(mailgunApiKey && !mailgunApiKey.includes('API_KEY') && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM);
const mailgun = mailgunReady
  ? new Mailgun(FormData).client({
      username: 'api',
      key: mailgunApiKey,
      ...(process.env.MAILGUN_API_URL ? { url: process.env.MAILGUN_API_URL } : {}),
    })
  : null;

app.get('/api/health', (_req, res) => res.json({ ok: true, databaseConfigured: ready, emailConfigured: mailgunReady }));

async function authenticatedUser(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !admin) return res.status(401).json({ error: 'Please sign in to continue.' });
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' });
  req.user = user;
  next();
}

async function sendMail(to, subject, text) {
  if (!mailgunReady) return { sent: false };
  await mailgun.messages.create(process.env.MAILGUN_DOMAIN, {
    from: process.env.MAILGUN_FROM,
    to,
    subject,
    text,
  });
  return { sent: true };
}

app.post('/api/notifications', authenticatedUser, async (req, res) => {
  try {
    if (!ready) return res.status(503).json({ error: 'The marketplace database is not configured yet.' });
    const { action, listingId } = req.body || {};
    if (!['listing_created', 'purchase_inquiry'].includes(action) || typeof listingId !== 'string') return res.status(400).json({ error: 'Invalid notification request.' });
    const { data: listing, error } = await admin.from('listings').select('id,title,price,location,seller_id').eq('id', listingId).single();
    if (error || !listing) return res.status(404).json({ error: 'This listing is no longer available.' });
    if (action === 'listing_created') {
      if (listing.seller_id !== req.user.id) return res.status(403).json({ error: 'You can only confirm your own listing.' });
      const outcome = await sendMail(req.user.email, 'Your listing is live on The Shop', `Hi ${req.user.user_metadata?.full_name || 'there'},\n\nYour listing “${listing.title}” is now live on The Shop.\n\nYou can view it in the marketplace whenever you like.\n\nThe Shop`);
      return res.json(outcome);
    }
    if (listing.seller_id === req.user.id) return res.status(400).json({ error: 'You cannot inquire about your own listing.' });
    const { data: sellerData, error: sellerError } = await admin.auth.admin.getUserById(listing.seller_id);
    if (sellerError || !sellerData?.user?.email) return res.status(404).json({ error: 'The seller could not be reached.' });
    const buyerName = req.user.user_metadata?.full_name || req.user.email;
    const price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(listing.price);
    const buyerText = `Hi ${req.user.user_metadata?.full_name || 'there'},\n\nWe’ve passed your interest in “${listing.title}” (${price}) to the seller. They can reply to you at ${req.user.email}.\n\nThere is no payment on The Shop. Please agree on the details directly and meet safely.\n\nThe Shop`;
    const sellerText = `Hi there,\n\n${buyerName} (${req.user.email}) is interested in your listing “${listing.title}” (${price}). You can reply to them directly to arrange the details.\n\nThere is no payment on The Shop. Please agree on the details directly and meet safely.\n\nThe Shop`;
    await Promise.all([sendMail(req.user.email, 'We received your interest on The Shop', buyerText), sendMail(sellerData.user.email, `Someone is interested in ${listing.title}`, sellerText)]);
    return res.json({ sent: mailgunReady });
  } catch (error) {
    console.error('Notification failed:', error.message);
    return res.status(502).json({ error: error.message || 'Could not send confirmation email.' });
  }
});

app.listen(port, () => console.log(`The Shop API listening on http://localhost:${port}`));
