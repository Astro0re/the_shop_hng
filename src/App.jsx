import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Leaf, Menu, Plus, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Tag, X } from 'lucide-react';
import { supabase, supabaseConfigured } from './supabase.js';

const categories = ['All things', 'Furniture', 'Electronics', 'Home & living', 'Clothing', 'Books & hobbies'];
const sampleItems = [
  { id: 'sample-1', title: 'Sunday morning armchair', category: 'Furniture', price: 85000, condition: 'Pre-loved', location: 'Lekki, Lagos', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=85', seller_name: 'Tomi A.', created_at: '2026-09-20', description: 'A comfortable little chair with lots of life left. Kept in a smoke-free home.' },
  { id: 'sample-2', title: 'The everyday film camera', category: 'Electronics', price: 42000, condition: 'Like new', location: 'Yaba, Lagos', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85', seller_name: 'Musa O.', created_at: '2026-09-22', description: 'Easy-to-use point and shoot, perfect for weekends and travel.' },
  { id: 'sample-3', title: 'Handwoven market tote', category: 'Clothing', price: 12500, condition: 'Good', location: 'Ikeja, Lagos', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85', seller_name: 'Ada C.', created_at: '2026-09-24', description: 'Roomy woven bag, gently used and ready for its next outing.' },
  { id: 'sample-4', title: 'A lamp for slow evenings', category: 'Home & living', price: 28000, condition: 'Pre-loved', location: 'Surulere, Lagos', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85', seller_name: 'Kemi B.', created_at: '2026-09-25', description: 'Warm light, sturdy base, and a new shade added last year.' },
  { id: 'sample-5', title: 'The little reading stack', category: 'Books & hobbies', price: 9500, condition: 'Good', location: 'Ikoyi, Lagos', image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1000&q=85', seller_name: 'Nneka E.', created_at: '2026-09-26', description: 'Five much-loved novels looking for a new bookshelf.' },
  { id: 'sample-6', title: 'A table made for company', category: 'Furniture', price: 110000, condition: 'Good', location: 'Victoria Island, Lagos', image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1000&q=85', seller_name: 'Seyi D.', created_at: '2026-09-27', description: 'Solid wood dining table. A few little marks that tell its story.' },
];
const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState(sampleItems);
  const [isLive, setIsLive] = useState(false);
  const [category, setCategory] = useState('All things');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const loadItems = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data, error } = await supabase.from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (!error && data) { setItems(data); setIsLive(true); }
  }, []);
  useEffect(() => { loadItems(); }, [loadItems]);

  const visibleItems = useMemo(() => {
    let result = items.filter((item) => category === 'All things' || item.category === category);
    if (query.trim()) result = result.filter((item) => `${item.title} ${item.category} ${item.location}`.toLowerCase().includes(query.toLowerCase()));
    return sort === 'price-low' ? [...result].sort((a, b) => a.price - b.price) : sort === 'price-high' ? [...result].sort((a, b) => b.price - a.price) : [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [items, category, query, sort]);

  function alertUser(message) { setNotice(message); window.setTimeout(() => setNotice(''), 4500); }
  async function signIn() {
    if (!supabaseConfigured) { setModal({ type: 'config' }); return; }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) alertUser(error.message);
  }
  async function signOut() { await supabase?.auth.signOut(); setUser(null); }
  async function submitListing(event) {
    event.preventDefault();
    if (!user) { setModal({ type: 'signin' }); return; }
    const form = new FormData(event.currentTarget);
    const listing = { title: form.get('title'), category: form.get('category'), price: Number(form.get('price')), condition: form.get('condition'), location: form.get('location'), image: form.get('image') || null, description: form.get('description') || '', seller_id: user.id };
    setBusy(true);
    try {
      const { data, error } = await supabase.from('listings').insert(listing).select().single();
      if (error) throw error;
      const mail = await sendActionEmail('listing_created', { listingId: data.id });
      await loadItems(); setModal(null); event.currentTarget.reset();
      alertUser(mail.sent ? 'Your listing is live. A confirmation email is on its way.' : 'Your listing is live. Mailgun is not configured, so no confirmation email was sent.');
    } catch (error) { alertUser(error.message || 'Could not publish your listing.'); }
    finally { setBusy(false); }
  }
  async function sendActionEmail(action, data) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ action, ...data }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Email could not be sent.');
    return result;
  }
  async function buyItem(item) {
    if (!user) { setModal({ type: 'signin' }); return; }
    if (user.id === item.seller_id) { alertUser('This is your listing.'); return; }
    setBusy(true);
    try {
      const mail = await sendActionEmail('purchase_inquiry', { listingId: item.id });
      setModal(null); alertUser(mail.sent ? 'Your interest is confirmed. You and the seller will receive an email with next steps.' : 'Mailgun is not configured, so your inquiry email could not be sent.');
    } catch (error) { alertUser(error.message); }
    finally { setBusy(false); }
  }
  function toggleFavorite(id) { setFavorites((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]); }

  return <div className="app-shell">
    <div className="announcement"><Sparkles size={14} /> Good things deserve a second home <span className="announce-dot">·</span> A kinder way to shop</div>
    <header className="site-header">
      <a href="#top" className="brand" aria-label="The Shop home"><span className="brand-mark"><ShoppingBag size={19} strokeWidth={1.8} /></span><span>the shop<span className="brand-period">.</span></span></a>
      <nav className={`nav-links ${mobileMenu ? 'nav-open' : ''}`} aria-label="Main navigation"><a href="#marketplace" onClick={() => setMobileMenu(false)}>Discover</a><a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a><a href="#our-promise" onClick={() => setMobileMenu(false)}>Our promise</a></nav>
      <div className="header-actions"><button className="sell-link" onClick={() => user ? setModal({ type: 'sell' }) : setModal({ type: 'signin' })}><Plus size={16} /> Sell an item</button>{user ? <button className="avatar-button" onClick={signOut} title="Sign out" aria-label="Sign out">{(user.user_metadata?.full_name || user.email || 'U').slice(0, 1).toUpperCase()}</button> : <button className="signin-button" onClick={signIn}>Sign in <ArrowUpRight size={15} /></button>}<button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X /> : <Menu />}</button></div>
    </header>
    <main id="top">
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> A marketplace with a little more meaning</div><h1>Good things,<br /><span>passed on.</span></h1><p>Find the pieces that feel like they were waiting for you. Give the things you love a new place to belong.</p><div className="hero-buttons"><a className="button-primary" href="#marketplace">Explore the marketplace <ArrowRight size={17} /></a><button className="button-text" onClick={() => user ? setModal({ type: 'sell' }) : setModal({ type: 'signin' })}>I have something to sell <ArrowUpRight size={16} /></button></div><div className="hero-trust"><div className="avatar-stack"><span>T</span><span>M</span><span>A</span><span>+</span></div><div><strong>A community that cares</strong><small>Thoughtful finds, better prices, less waste</small></div></div></div><div className="hero-visual"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=90" alt="A warm, lived-in home with thoughtfully chosen furniture" /><div className="photo-wash" /></div><div className="float-card"><div className="float-card-icon"><Leaf size={18} /></div><div><small>A lovely little thought</small><strong>One less thing made new.</strong></div><span className="float-sparkle">✳</span></div><div className="hero-stamp"><span>find it<br />love it<br />pass it on</span><ArrowDown size={17} /></div><div className="photo-caption">A softer way to find your next favourite thing</div></div></section>
      <section className="values-strip" id="our-promise"><div className="value"><span className="value-icon"><Heart size={18} /></span><div><strong>Curated with care</strong><small>Real finds from real people</small></div></div><span className="value-divider" /><div className="value"><span className="value-icon"><ShieldCheck size={19} /></span><div><strong>People come first</strong><small>Connect directly, shop with care</small></div></div><span className="value-divider" /><div className="value"><span className="value-icon"><Leaf size={19} /></span><div><strong>A lighter footprint</strong><small>Good for your home, lighter on ours</small></div></div><a href="#how-it-works" className="values-link">The way we do things <ArrowRight size={15} /></a></section>
      <section className="market-section" id="marketplace"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> A few things worth finding</div><h2>The good finds<span className="brand-period">.</span></h2><p>Pieces with a past, ready for whatever comes next.</p></div><a className="browse-all" href="#marketplace">Browse all finds <ArrowRight size={16} /></a></div>
        <div className="market-controls"><div className="category-list">{categories.map((name) => <button key={name} className={`category-pill ${category === name ? 'active' : ''}`} onClick={() => setCategory(name)}>{name}</button>)}</div><div className="control-right"><label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find something lovely" aria-label="Search listings" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}</label><label className="sort-select"><SlidersHorizontal size={15} /><select aria-label="Sort listings" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Just added</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={14} /></label></div></div>
        {!isLive && <div className="demo-note"><Sparkles size={14} /> A little preview of what you might find here.</div>}
        <div className="listing-grid">{visibleItems.map((item) => <article className="listing-card" key={item.id}><div className="listing-image" role="button" tabIndex={0} onClick={() => setModal({ type: 'item', item })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModal({ type: 'item', item }); }} aria-label={`View ${item.title}`}><img src={item.image || 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80'} alt={item.title} loading="lazy" /><span className="item-condition">{item.condition}</span><button className={`favorite-button ${favorites.includes(item.id) ? 'is-favorite' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} aria-label={favorites.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}><Heart size={17} fill={favorites.includes(item.id) ? 'currentColor' : 'none'} /></button></div><div className="listing-details"><div className="item-category">{item.category}</div><h3>{item.title}</h3><div className="listing-bottom"><strong>{money.format(item.price)}</strong><span>{item.location}</span></div><div className="seller-line"><span className="seller-avatar">{(item.seller_name || 'S').slice(0, 1)}</span> With love from {item.seller_name || 'a neighbour'}<button onClick={() => setModal({ type: 'item', item })} aria-label={`See ${item.title}`}><ArrowUpRight size={16} /></button></div></div></article>)}</div>
        {visibleItems.length === 0 && <div className="empty-state"><span><Search /></span><h3>Nothing here just yet.</h3><p>Try another search or category. Your next favourite might be around the corner.</p><button className="button-text" onClick={() => { setQuery(''); setCategory('All things'); }}>Show me everything <ArrowRight size={15} /></button></div>}
        <div className="market-footer"><span>Showing {visibleItems.length} thoughtful {visibleItems.length === 1 ? 'find' : 'finds'}</span><button className="button-outline" onClick={() => alertUser('You’re all caught up for now. Check back for more thoughtful finds!')}>That’s everything <Check size={15} /></button></div>
      </section>
      <section className="sell-banner"><div className="sell-banner-art"><span className="art-ring ring-one" /><span className="art-ring ring-two" /><span className="art-sparkle">✳</span><Tag size={48} strokeWidth={1.1} /></div><div className="sell-banner-copy"><div className="eyebrow"><span className="eyebrow-line" /> Your next chapter starts here</div><h2>Someone’s looking<br />for what you <em>already have.</em></h2><p>Clear a little space. Pass on a little joy. Listing something takes just a minute.</p></div><button className="button-light" onClick={() => user ? setModal({ type: 'sell' }) : setModal({ type: 'signin' })}>Share something lovely <ArrowUpRight size={17} /></button></section>
      <section className="how-section" id="how-it-works"><div className="section-heading how-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> Easy as passing it on</div><h2>Good things happen<br />when things <em>get around.</em></h2></div><p>We keep the steps simple so you can spend less time figuring it out and more time finding what feels right.</p></div><div className="steps-grid"><div className="step"><span className="step-number">01</span><span className="step-icon"><Search /></span><h3>Find your something</h3><p>Browse at your own pace. Search, save a favourite, or just see where you end up.</p></div><div className="step-arrow"><ArrowRight /></div><div className="step"><span className="step-number">02</span><span className="step-icon"><Heart /></span><h3>Say hello</h3><p>Found the one? Send the seller a note and talk through the details together.</p></div><div className="step-arrow"><ArrowRight /></div><div className="step"><span className="step-number">03</span><span className="step-icon"><Sparkles /></span><h3>Make it yours</h3><p>Arrange a handover that works for you both. Your new favourite is home.</p></div></div></section>
      <section className="quote-section"><div className="quote-mark">“</div><blockquote>Some of the best things in our home were <em>someone else’s first.</em></blockquote><div className="quote-attribution"><span className="quote-avatar">O</span><span><strong>Oluchi, one of our neighbours</strong><small>Here since the beginning</small></span></div><div className="quote-decoration">✳</div></section>
      <section className="newsletter"><div className="newsletter-leaf"><Leaf size={27} /></div><div><div className="eyebrow"><span className="eyebrow-line" /> A note from the neighbourhood</div><h2>A little good thing<br />in your inbox.</h2><p>New finds, thoughtful stories, and the occasional note from us. Never too much.</p></div><form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alertUser('Lovely. Keep an eye on your inbox!'); e.currentTarget.reset(); }}><label htmlFor="newsletter-email">Your email address</label><div><input type="email" id="newsletter-email" placeholder="you@example.com" required /><button type="submit" aria-label="Subscribe">Count me in <ArrowRight size={16} /></button></div><small>No noise, no nonsense. Unsubscribe whenever you like.</small></form></section>
    </main>
    <footer className="footer"><div className="footer-top"><a href="#top" className="brand"><span className="brand-mark"><ShoppingBag size={18} /></span><span>the shop<span className="brand-period">.</span></span></a><p>Good things deserve a second home.</p><div className="footer-links"><a href="#marketplace">Discover</a><a href="#how-it-works">How it works</a><a href="mailto:hello@theshop.example">Say hello</a></div></div><div className="footer-bottom"><span>© 2026 The Shop. Made with a little more care.</span><span><Leaf size={14} /> Less new, more loved.</span></div></footer>
    {notice && <div className="toast" role="status"><Check size={17} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    {modal && <div className="modal-backdrop" onClick={() => !busy && setModal(null)}><div className={`modal-card ${modal.type === 'item' ? 'item-modal' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button>
      {modal.type === 'sell' && <><div className="modal-kicker"><span className="value-icon"><Tag size={17} /></span> Pass it on</div><h2>List something lovely.</h2><p className="modal-intro">A few details help someone find their next favourite thing.</p><form className="listing-form" onSubmit={submitListing}><label>What are you sharing?<input name="title" placeholder="A name that says it all" required maxLength="100" /></label><div className="form-row"><label>Category<select name="category" required>{categories.slice(1).map((x) => <option key={x}>{x}</option>)}</select></label><label>Condition<select name="condition"><option>Pre-loved</option><option>Like new</option><option>Good</option><option>Well-loved</option></select></label></div><div className="form-row"><label>Price (₦)<input name="price" type="number" min="1" placeholder="0" required /></label><label>Your neighbourhood<input name="location" placeholder="e.g. Yaba, Lagos" required /></label></div><label>Photo URL<input name="image" type="url" placeholder="https://…" /></label><label>A little about it<textarea name="description" rows="3" placeholder="What should someone know?" maxLength="500" /></label><button className="button-primary form-submit" disabled={busy}>{busy ? 'Sharing…' : 'Share this find'} <ArrowRight size={16} /></button><small className="form-privacy"><ShieldCheck size={13} /> Your email stays private. We only share it when you send an inquiry.</small></form></>}
      {modal.type === 'signin' && <><div className="signin-illustration"><ShoppingBag size={27} /></div><div className="eyebrow centered"><span className="eyebrow-line" /> Good to have you here</div><h2>Come on in.</h2><p className="modal-intro centered-copy">Sign in to find your next favourite thing, or pass something lovely along.</p><button className="google-button" onClick={signIn}><GoogleMark /> Continue with Google <ArrowRight size={16} /></button><small className="signin-note"><ShieldCheck size={13} /> A safe, simple sign-in. We never share your details.</small></>}
      {modal.type === 'config' && <><div className="modal-kicker"><span className="value-icon"><ShieldCheck size={17} /></span> A quick setup note</div><h2>Almost ready.</h2><p className="modal-intro">Google sign-in connects through your Supabase project. Add the following values to a local <code>.env</code> file, then enable Google under Authentication → Providers in Supabase.</p><div className="config-callout">VITE_SUPABASE_URL<br />VITE_SUPABASE_ANON_KEY<br />SUPABASE_SERVICE_ROLE_KEY<br />MAILGUN_API_KEY · MAILGUN_DOMAIN</div><button className="button-primary form-submit" onClick={() => setModal(null)}>Got it <Check size={16} /></button></>}
      {modal.type === 'item' && <><div className="item-modal-image"><img src={modal.item.image || sampleItems[0].image} alt={modal.item.title} /></div><div className="item-modal-content"><div className="item-category">{modal.item.category} <span>·</span> {modal.item.condition}</div><h2>{modal.item.title}</h2><strong className="item-modal-price">{money.format(modal.item.price)}</strong><p>{modal.item.description || 'A thoughtful find, ready for a new home.'}</p><div className="item-modal-seller"><span className="seller-avatar">{(modal.item.seller_name || 'S').slice(0, 1)}</span><span>Listed with love by <strong>{modal.item.seller_name || 'a neighbour'}</strong><small>{modal.item.location}</small></span></div><button className="button-primary form-submit" disabled={busy} onClick={() => buyItem(modal.item)}>{busy ? 'Sending…' : 'I’m interested'} <ArrowRight size={16} /></button><small className="form-privacy"><ShieldCheck size={13} /> No payment here. You’ll connect and arrange the details together.</small></div></>}
    </div></div>}
  </div>;
}

function GoogleMark() { return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" transform="translate(0 4)"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.6 5.9c4.44-4.1 7.16-10.15 7.16-17.55z"/><path fill="#FBBC05" d="M10.53 28.59a14.36 14.36 0 0 1 0-9.18l-7.98-6.2a23.92 23.92 0 0 0 0 21.57z" transform="translate(0 0)"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.6-5.9c-2.12 1.42-4.84 2.27-8.3 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.2C6.51 42.63 14.62 48 24 48z"/></svg>; }

export default App;
