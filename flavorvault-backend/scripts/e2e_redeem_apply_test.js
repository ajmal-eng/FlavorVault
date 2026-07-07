const assert = require('assert');

const BASE = process.env.FLAVORVAULT_API_BASE || 'http://localhost:5000';

async function req(path, opts){
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let json=null;
  try{ json = JSON.parse(text); }catch(e){}
  return { status: res.status, text, json };
}

async function run(){
  console.log('E2E: register user');
  const ures = await req('/api/users/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: 'E2E User', email: `e2e+${Date.now()}@example.com`, password: 'pass1234', phone: '+91 9000000000', address: 'Test' }) });
  assert(ures.status === 201, 'register failed: '+ures.text);
  const user = JSON.parse(ures.text).user;

  console.log('E2E: create order to earn points');
  const items = [{ foodId: '999', name: 'Big Order', price: 150, quantity: 1 }];
  const subtotal = 150;
  const createRes = await req('/api/orders/create', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ customerName: user.name, userId: user._id, phone: user.phone, address: user.address, items, totalAmount: subtotal, subtotal }) });
  assert(createRes.status === 201, 'create order failed: '+createRes.text);
  const order = JSON.parse(createRes.text).order;

  console.log('E2E: mark order delivered to award points');
  const statusRes = await req(`/api/orders/${order._id}/status`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'delivered' }) });
  assert(statusRes.status === 200, 'status update failed: '+statusRes.text);

  console.log('E2E: fetch points and redeem r5');
  const pointsRes = await req(`/api/users/${user._id}/points`);
  assert(pointsRes.status === 200, 'points fetch failed');
  const points = pointsRes.json.user.points;
  assert(points >= 100, 'expected points >=100, got '+points);

  const redeemRes = await req('/api/users/redeem', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user._id, rewardId: 'r5' }) });
  assert(redeemRes.status === 200 && redeemRes.json && redeemRes.json.couponCode, 'redeem failed: '+redeemRes.text);
  const couponCode = redeemRes.json.couponCode;

  console.log('E2E: validate coupon and create order with coupon');
  const couponFetch = await req('/api/coupons/'+encodeURIComponent(couponCode));
  assert(couponFetch.status === 200 && couponFetch.json && couponFetch.json.coupon, 'coupon lookup failed');
  const coupon = couponFetch.json.coupon;

  const items2 = [{ foodId: '1', name: 'Test Food', price: 10, quantity: 2 }];
  const subtotal2 = 20;
  let discountAmount = 0;
  if (coupon.type === 'fixed') discountAmount = coupon.amount; else discountAmount = subtotal2 * (coupon.discount/100);
  const total2 = Math.max(subtotal2 - discountAmount, 0);

  const orderRes = await req('/api/orders/create', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ customerName: user.name, userId: user._id, phone: user.phone, address: user.address, items: items2, totalAmount: total2, couponCode, discount: coupon.type === 'fixed' ? coupon.amount : coupon.discount, discountType: coupon.type, subtotal: subtotal2 }) });
  assert(orderRes.status === 201, 'order with coupon failed: '+orderRes.text);

  console.log('E2E: success');
}

run().then(() => {
  console.log('E2E completed successfully.');
  process.exitCode = 0;
}).catch((e) => {
  console.error('E2E failed:', e);
  process.exitCode = 2;
});
