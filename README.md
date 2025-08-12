
# Lond Fullstack (Proxy + Static)

Bu paket; **Node.js backend proxy** + **statik frontend** içerir.
- Backend: Trendyol API'ye Basic Auth ile bağlanır ve `/api/orders` üzerinden frontend'e verir.
- Frontend: `public/` altında; panel `/app/` yolundadır.

## Çalıştırma (lokal)
```
SELLER_ID=1106731 API_KEY=EmqCX1WodX2S93mZn8U6 TRENDYOL_ENV=stage npm install
npm start
# http://localhost:3000
# Test: GET http://localhost:3000/api/orders?status=Awaiting&size=20
```

## Render'da yayınlama (Web Service)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `SELLER_ID` = 1106731
  - `API_KEY` = EmqCX1WodX2S93mZn8U6
  - `TRENDYOL_ENV` = stage  (canlı için `prod` yazın)
- Yayına aldıktan sonra:
  - Landing: `https://<senin-servisin>.onrender.com/`
  - Panel:   `https://<senin-servisin>.onrender.com/app/`
  - API:     `https://<senin-servisin>.onrender.com/api/orders?status=Awaiting&size=20&page=0`

> Güvenlik: API key yalnızca sunucuda tutulur; tarayıcıya gönderilmez.


## Ek Değişkenler
- `API_SECRET` = (Bazı endpoint'ler için gerekecek; Orders için zorunlu değildir)
- `TY_USER_AGENT` = "ŞirketAdı/Versiyon (iletişim: email@ornek.com)" — Trendyol dokümanında önerilir
