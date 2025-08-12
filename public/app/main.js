// Basit durum yazıcı
const statusEl = document.getElementById("statusText");
const setStatus = (t) => statusEl.textContent = t;

// Sağlık kontrolü
(async () => {
  try {
    const r = await fetch("/api/health");
    const j = await r.json();
    document.getElementById("apiState").textContent = j.ok ? `çalışıyor (${j.env})` : "hata";
  } catch {
    document.getElementById("apiState").textContent = "erişilemiyor";
  }
})();

document.getElementById("refreshBtn").addEventListener("click", () => location.reload());

document.getElementById("fetchOrdersBtn").addEventListener("click", loadOrders);

async function loadOrders(){
  const status = document.getElementById("statusSel").value || "Awaiting";
  const size = +document.getElementById("sizeInp").value || 20;
  const page = +document.getElementById("pageInp").value || 0;

  setStatus("Yükleniyor…");
  try{
    const url = `/api/orders?status=${encodeURIComponent(status)}&size=${size}&page=${page}`;
    const r = await fetch(url, { headers: { "Accept":"application/json" }});
    const text = await r.text();

    let data;
    try { data = JSON.parse(text); } catch {
      // Backend zaten JSON kılıfına sarıyor; ama yine de gösterelim
      data = { ok:false, raw:text };
    }

    // ham çıktıyı debug için göstermek istersen:
    const raw = document.getElementById("rawOut");
    raw.style.display = "none";
    raw.textContent = "";

    // Trendyol yanıt şekilleri farklı olabilir; yaygın olasılıkları toparlayalım
    const rows = normalizeOrders(data);

    renderTable(rows);

    if (rows.length === 0) {
      document.getElementById("emptyHint").style.display = "block";
      raw.style.display = "block";
      raw.textContent = JSON.stringify(data, null, 2);
      setStatus(`Bitti • kayıt yok (HTTP ${r.status})`);
    } else {
      document.getElementById("emptyHint").style.display = "none";
      setStatus(`Bitti • ${rows.length} kayıt (HTTP ${r.status})`);
    }
  }catch(e){
    setStatus("Hata: " + (e.message||e));
  }
}

// Trendyol olası yanıtlarını tek bir diziye dönüştür
function normalizeOrders(resp){
  // Bazı dökümanlarda data.content, bazı örneklerde result.content vb. olabilir
  const candidates = [
    resp?.content,
    resp?.result?.content,
    resp?.orders,
    resp?.data?.content,
    Array.isArray(resp) ? resp : null
  ].filter(Boolean)[0];

  const list = Array.isArray(candidates) ? candidates : [];

  // Alan isimleri de farklı olabilir; güvenli erişim yapalım
  return list.map((o, i) => {
    const orderId = o.id ?? o.orderId ?? o.number ?? o.orderNumber ?? o.packageId ?? "";
    const orderNo = o.orderNumber ?? o.number ?? orderId ?? "";
    const status = o.status ?? o.orderStatus ?? o.packageStatus ?? "";
    const total = (
      o.totalPrice ?? o.totalAmount ?? o.price ?? o.grossAmount ?? 0
    );
    const created = o.createdDate ?? o.orderDate ?? o.createDate ?? o.createdAt ?? "";
    const customer = [
      o.customer?.firstName,
      o.customer?.lastName
    ].filter(Boolean).join(" ") || (o.customerName ?? o.buyerName ?? "");

    return { idx: i+1, orderNo, customer, status, total, created };
  });
}

function renderTable(rows){
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.idx}</td>
      <td>${safe(r.orderNo)}</td>
      <td>${safe(r.customer)}</td>
      <td><span class="pill">${safe(r.status)}</span></td>
      <td>${formatMoney(r.total)}</td>
      <td>${formatDate(r.created)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function safe(v){ return (v===undefined||v===null) ? "" : String(v); }
function formatMoney(v){
  const n = Number(v||0);
  return n ? n.toLocaleString("tr-TR", { style:"currency", currency:"TRY" }) : "";
}
function formatDate(v){
  if(!v) return "";
  try{
    // ISO tarihse
    const d = new Date(v);
    if(!isNaN(d.getTime())) return d.toLocaleString("tr-TR");
    // epoch sayısıysa
    const n = Number(v);
    if(!isNaN(n)) return new Date(n).toLocaleString("tr-TR");
  }catch{}
  return String(v);
}

// İlk yüklemede otomatik dene
loadOrders();
