/* ── Mock DB — in-memory store, no PostgreSQL required ── */

const users = [
  { id: 1, name: 'Administrador', pin: '0000', role: 'admin',    active: true, created_at: new Date() },
  { id: 2, name: 'Cajero 1',      pin: '1111', role: 'cashier',  active: true, created_at: new Date() },
  { id: 3, name: 'Cajero 2',      pin: '2222', role: 'cashier',  active: true, created_at: new Date() },
];

const products = [
  { id:1,  name:'Espresso "Black Monday"',   description:'Café espresso doble de origen etíope.',           category:'Cafés',    base_price:2500, current_price:2500, min_price:1500, max_price:5000, image_emoji:'☕', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:2,  name:'Cappuccino "Bull Market"',  description:'Cappuccino cremoso que sube como el mercado.',    category:'Cafés',    base_price:3200, current_price:3200, min_price:2000, max_price:6000, image_emoji:'🐂', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:3,  name:'Latte "Bear Trap"',         description:'Latte suave con canela y vainilla.',               category:'Cafés',    base_price:3500, current_price:3500, min_price:2200, max_price:6500, image_emoji:'🐻', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:4,  name:'Americano "IPO"',           description:'Primera oferta pública de sabor.',                 category:'Cafés',    base_price:2800, current_price:2800, min_price:1800, max_price:5500, image_emoji:'📈', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:5,  name:'Mocha "Leverage"',          description:'Mocha con doble shot y chocolate belga.',          category:'Cafés',    base_price:4000, current_price:4000, min_price:2500, max_price:7500, image_emoji:'💹', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:6,  name:'Flat White "Hedge Fund"',   description:'Café concentrado con leche micro-vaporizada.',    category:'Cafés',    base_price:3800, current_price:3800, min_price:2400, max_price:7000, image_emoji:'🏦', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:7,  name:'Té Verde "Portfolio"',      description:'Té verde japonés matcha.',                         category:'Tés',      base_price:2200, current_price:2200, min_price:1400, max_price:4500, image_emoji:'🍵', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:8,  name:'Té Chai "Emerging"',        description:'Blend especiado: cardamomo, canela y jengibre.',   category:'Tés',      base_price:2600, current_price:2600, min_price:1600, max_price:5000, image_emoji:'🌏', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:9,  name:'Croissant "Dividend"',      description:'Croissant de mantequilla francesa.',               category:'Pasteles', base_price:1800, current_price:1800, min_price:1200, max_price:3500, image_emoji:'🥐', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:10, name:'Muffin "High Yield"',       description:'Muffin de arándanos con alto rendimiento.',        category:'Pasteles', base_price:2000, current_price:2000, min_price:1300, max_price:4000, image_emoji:'🧁', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:11, name:'Torta "Market Cap"',        description:'Porción de torta de chocolate con ganache.',       category:'Pasteles', base_price:3000, current_price:3000, min_price:2000, max_price:6000, image_emoji:'🍰', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:12, name:'Sandwich "Merger"',         description:'Fusión de pavo, queso gouda y pesto.',             category:'Comida',   base_price:4500, current_price:4500, min_price:3000, max_price:8000, image_emoji:'🥪', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:13, name:'Bowl Açaí "ESG"',           description:'Bowl de açaí con granola y frutos del bosque.',    category:'Comida',   base_price:4800, current_price:4800, min_price:3200, max_price:9000, image_emoji:'🫐', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:14, name:'Jugo Natural "Liquidity"',  description:'Jugo de frutas de estación.',                      category:'Bebidas',  base_price:2800, current_price:2800, min_price:1800, max_price:5500, image_emoji:'🧃', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:15, name:'Agua Mineral "Safe Haven"', description:'El refugio seguro en tiempos de volatilidad.',    category:'Bebidas',  base_price:1200, current_price:1200, min_price:800,  max_price:2500, image_emoji:'💧', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
  { id:16, name:'Kombucha "Derivatives"',    description:'Bebida fermentada premium.',                       category:'Bebidas',  base_price:3200, current_price:3200, min_price:2000, max_price:6000, image_emoji:'🫧', active:true, stock:999, price_paused:false, last_sale_at:null, inc_min:null, inc_max:null, dec_min:null, dec_max:null },
];

let sessions = [];
let sales    = [];
let saleDetails = [];
let priceHistory = [];
let customers = [];
let priceAlerts = [];
let nextSaleId      = 1;
let nextSessionId   = 1;
let nextCustomerId  = 1;
let nextAlertId     = 1;

// ── Simple SQL parser ─────────────────────────────────────────
const query = async (sql, params = []) => {
  const s = sql.trim().toLowerCase();

  // AUTH ────────────────────────────────────────────────────────
  if (s.includes('from users where pin')) {
    const pin = String(params[0]);
    const rows = users.filter(u => u.pin === pin && u.active);
    return { rows };
  }
  if (s.includes('from users')) {
    return { rows: users.filter(u => u.active) };
  }

  // PRODUCTS ────────────────────────────────────────────────────
  if (s.includes('from products') && s.includes('where id')) {
    const id = parseInt(params[0]);
    const rows = products.filter(p => p.id === id && p.active);
    return { rows };
  }
  if (s.includes('from products')) {
    return { rows: products.filter(p => p.active) };
  }
  if (s.includes('update products') && s.includes('current_price')) {
    const price = parseFloat(params[0]);
    const id    = parseInt(params[params.length - 1]);
    const p = products.find(p => p.id === id);
    if (p) {
      p.current_price = price;
      p.updated_at = new Date();
    }
    return { rows: p ? [p] : [] };
  }
  if (s.includes('update products') && s.includes('last_sale_at')) {
    const id = parseInt(params[params.length - 1]);
    const p = products.find(p => p.id === id);
    if (p) p.last_sale_at = new Date();
    return { rows: [] };
  }
  if (s.includes('update products') && s.includes('stock')) {
    const stock = parseInt(params[0]);
    const id    = parseInt(params[params.length - 1]);
    const p = products.find(p => p.id === id);
    if (p) p.stock = stock;
    return { rows: p ? [p] : [] };
  }

  // PRICE HISTORY ───────────────────────────────────────────────
  if (s.includes('insert into price_history')) {
    priceHistory.push({
      id: priceHistory.length + 1,
      product_id: params[0], product_name: params[1],
      old_price: params[2], new_price: params[3],
      change_percent: params[4], change_reason: params[5],
      created_at: new Date()
    });
    return { rows: [] };
  }
  if (s.includes('from price_history')) {
    const id = params[0] ? parseInt(params[0]) : null;
    const rows = id
      ? priceHistory.filter(h => h.product_id === id).slice(-50)
      : priceHistory.slice(-100);
    return { rows };
  }

  // LEADERBOARD ─────────────────────────────────────────────────
  if (s.includes('from customers') && s.includes('order by') && s.includes('points')) {
    const rows = customers
      .filter(c => c.active && (c.points || 0) > 0)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
      .map(c => ({ id: c.id, name: c.name, points: c.points || 0 }));
    return { rows };
  }

  // CUSTOMER PROFILE (LEFT JOIN) ────────────────────────────────
  if (s.includes('from customers') && s.includes('left join') && s.includes('sales')) {
    const customerId = parseInt(params[0]);
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return { rows: [] };
    const customerSales = sales.filter(s => s.customer_id === customerId);
    const totalOrders = customerSales.length;
    const totalSpent  = customerSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    return { rows: [{
      id: customer.id, name: customer.name, points: customer.points || 0,
      created_at: customer.created_at,
      total_orders: totalOrders, total_spent: totalSpent,
    }] };
  }

  // CUSTOMERS ───────────────────────────────────────────────────
  // More specific handlers first (name+pin before name-only)
  if (s.includes('from customers') && s.includes('where') && s.includes('pin')) {
    const name = String(params[0]);
    const pin  = String(params[1]);
    const rows = customers.filter(c => c.name === name && c.pin === pin && c.active);
    return { rows };
  }
  if (s.includes('from customers') && s.includes('where name')) {
    const name = String(params[0]);
    const rows = customers.filter(c => c.name === name);
    return { rows };
  }
  if (s.includes('insert into customers')) {
    const customer = {
      id: nextCustomerId++,
      name: params[0], pin: params[1],
      points: 0, active: true, created_at: new Date()
    };
    customers.push(customer);
    return { rows: [{ id: customer.id, name: customer.name, created_at: customer.created_at }] };
  }
  if (s.includes('update customers') && s.includes('points')) {
    const pts = parseInt(params[0]);
    const id  = parseInt(params[1]);
    const c   = customers.find(c => c.id === id);
    if (c) c.points = (c.points || 0) + pts;
    return { rows: c ? [c] : [] };
  }

  // CASH SESSIONS ───────────────────────────────────────────────
  if (s.includes('insert into cash_sessions')) {
    const session = {
      id: nextSessionId++,
      user_id: params[0], cashier_name: params[1],
      opened_at: new Date(), closed_at: null,
      total_sales: 0, total_subtotal: 0, total_tax: 0, total_revenue: 0
    };
    sessions.push(session);
    return { rows: [session] };
  }
  if (s.includes('from cash_sessions') && s.includes('where id')) {
    const id = parseInt(params[0]);
    return { rows: sessions.filter(s => s.id === id) };
  }
  if (s.includes('from cash_sessions') && s.includes('closed_at is null')) {
    const userId = params[0] ? parseInt(params[0]) : null;
    const open = sessions.filter(s => !s.closed_at && (!userId || s.user_id === userId));
    return { rows: open };
  }
  if (s.includes('update cash_sessions') && s.includes('closed_at')) {
    const id = parseInt(params[params.length - 1]);
    const sess = sessions.find(s => s.id === id);
    if (sess) {
      sess.closed_at = new Date();
      if (params[0]) sess.total_sales    = params[0];
      if (params[1]) sess.total_subtotal = params[1];
      if (params[2]) sess.total_tax      = params[2];
      if (params[3]) sess.total_revenue  = params[3];
    }
    return { rows: sess ? [sess] : [] };
  }

  // SALES ───────────────────────────────────────────────────────
  if (s.includes('insert into sales')) {
    const sale = {
      id: nextSaleId++,
      subtotal: params[0], tax_rate: params[1], tax_amount: params[2],
      total: params[3], user_id: params[4] || null,
      session_id: params[5] || null, cashier_name: params[6] || null,
      customer_id: params[7] || null,
      created_at: new Date()
    };
    sales.push(sale);
    // Update session counters
    if (sale.session_id) {
      const sess = sessions.find(s => s.id === sale.session_id);
      if (sess) {
        sess.total_sales++;
        sess.total_subtotal = parseFloat(sess.total_subtotal) + parseFloat(sale.subtotal);
        sess.total_tax      = parseFloat(sess.total_tax)      + parseFloat(sale.tax_amount);
        sess.total_revenue  = parseFloat(sess.total_revenue)  + parseFloat(sale.total);
      }
    }
    return { rows: [sale] };
  }
  if (s.includes('insert into sale_details')) {
    saleDetails.push({
      id: saleDetails.length + 1,
      sale_id: params[0], product_id: params[1], product_name: params[2],
      quantity: params[3], unit_price: params[4], subtotal: params[5],
      created_at: new Date()
    });
    return { rows: [] };
  }
  if (s.includes('from sales') && s.includes('where id')) {
    const id = parseInt(params[0]);
    return { rows: sales.filter(s => s.id === id) };
  }
  if (s.includes('from sales') && s.includes('customer_id')) {
    const customerId = parseInt(params[0]);
    const limit  = parseInt(params[1]) || 20;
    const offset = parseInt(params[2]) || 0;
    const filtered = sales.filter(s => s.customer_id === customerId);
    const sorted   = [...filtered].sort((a,b) => b.id - a.id).slice(offset, offset + limit);
    // Join sale_details (mirrors the json_agg in the real SQL)
    const rows = sorted.map(sale => ({
      ...sale,
      items: saleDetails
        .filter(d => d.sale_id === sale.id)
        .map(d => ({
          product_id:   d.product_id,
          product_name: d.product_name,
          quantity:     d.quantity,
          unit_price:   d.unit_price,
          subtotal:     d.subtotal,
        })),
    }));
    return { rows };
  }
  if (s.includes('from sales')) {
    const limit  = parseInt(params[0]) || (s.includes('limit') ? 20 : sales.length);
    const offset = parseInt(params[1]) || 0;
    const sorted = [...sales].sort((a,b) => b.id - a.id).slice(offset, offset + limit);
    return { rows: sorted };
  }
  if (s.includes('from sale_details')) {
    const saleId = parseInt(params[0]);
    return { rows: saleDetails.filter(d => d.sale_id === saleId) };
  }

  // PRICE ALERTS ────────────────────────────────────────────────
  if (s.includes('insert into price_alerts') || (s.includes('into price_alerts') && s.includes('on conflict'))) {
    const customerId  = parseInt(params[0]);
    const productId   = parseInt(params[1]);
    const targetPrice = parseFloat(params[2]);
    const fcmToken    = params[3] || null;
    // Upsert: remove existing for same customer+product, then insert
    const idx = priceAlerts.findIndex(a => a.customer_id === customerId && a.product_id === productId);
    if (idx !== -1) priceAlerts.splice(idx, 1);
    const alert = { id: nextAlertId++, customer_id: customerId, product_id: productId,
      target_price: targetPrice, fcm_token: fcmToken, active: true,
      triggered_at: null, created_at: new Date() };
    priceAlerts.push(alert);
    return { rows: [alert] };
  }
  if (s.includes('from price_alerts') && s.includes('product_id') && s.includes('target_price')) {
    // checkAlerts: WHERE product_id = $1 AND target_price >= $2 AND active = true
    const productId = parseInt(params[0]);
    const newPrice  = parseFloat(params[1]);
    const rows = priceAlerts.filter(a =>
      a.product_id === productId && a.target_price >= newPrice && a.active
    );
    return { rows };
  }
  if (s.includes('from price_alerts') && s.includes('customer_id') && s.includes('product_id')) {
    const customerId = parseInt(params[0]);
    const productId  = parseInt(params[1]);
    const rows = priceAlerts.filter(a => a.customer_id === customerId && a.product_id === productId && a.active);
    return { rows };
  }
  if (s.includes('from price_alerts') && s.includes('customer_id')) {
    const customerId = parseInt(params[0]);
    return { rows: priceAlerts.filter(a => a.customer_id === customerId && a.active) };
  }
  if (s.includes('update price_alerts') && s.includes('active = false')) {
    const id = parseInt(params[params.length - 1]);
    const alert = priceAlerts.find(a => a.id === id);
    if (alert) { alert.active = false; alert.triggered_at = new Date(); }
    return { rows: [] };
  }
  if (s.includes('delete from price_alerts')) {
    const customerId = parseInt(params[0]);
    const productId  = parseInt(params[1]);
    priceAlerts = priceAlerts.filter(a => !(a.customer_id === customerId && a.product_id === productId));
    return { rows: [] };
  }

  // REPORTS ─────────────────────────────────────────────────────
  if (s.includes('count(*)') || s.includes('sum(') || s.includes('coalesce')) {
    return { rows: [{ count: sales.length, total: 0, subtotal: 0, tax: 0 }] };
  }

  // DEFAULT ─────────────────────────────────────────────────────
  console.log('[MockDB] Unhandled query:', sql.substring(0, 80));
  return { rows: [] };
};

// Transaction client mock
const getClient = () => {
  let inTx = false;
  const client = {
    query:   (sql, params) => query(sql, params),
    release: () => {},
  };
  return Promise.resolve(client);
};

const pool = { end: () => {} };

module.exports = { query, getClient, pool };
