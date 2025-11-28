# DEPA OTOD Voucher - ระบบบันทึกการใช้งาน

ระบบเล็ก ๆ สำหรับบันทึกข้อมูลการใช้งาน DEPA OTOD Voucher รายวัน โดยใช้ Firebase Hosting และ Cloud Functions

## ฟีเจอร์หลัก

- บันทึกข้อมูลการใช้งาน Voucher รายวัน
- เชื่อมต่อกับ DEPA API โดยอัตโนมัติ
- ตรวจสอบประวัติการใช้งาน Voucher
- UI ที่ใช้งานง่าย สวยงาม
- รองรับการทำงานบน Firebase (ไม่ต้องมี Server เอง)

## โครงสร้างโปรเจค

```
depa_otod_voucher/
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # API endpoints
│   ├── package.json
│   ├── .env              # Environment variables (อย่าลืมตั้งค่า!)
│   └── .env.example      # ตัวอย่าง env file
├── public/                # Static website
│   ├── index.html        # หน้าบันทึกข้อมูล
│   └── check-usage.html  # หน้าตรวจสอบการใช้งาน
├── firebase.json         # Firebase configuration
├── .firebaserc          # Firebase project config
└── package.json
```

## การติดตั้ง

### 1. ติดตั้ง Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login เข้า Firebase

```bash
firebase login
```

### 3. สร้าง Firebase Project

ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วสร้างโปรเจคใหม่

### 4. เชื่อมต่อกับโปรเจค

แก้ไขไฟล์ `.firebaserc` ให้ใส่ชื่อโปรเจคของคุณ:

```json
{
  "projects": {
    "default": "ชื่อโปรเจคของคุณ"
  }
}
```

หรือใช้คำสั่ง:

```bash
firebase use --add
```

### 5. ติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies สำหรับ Functions
cd functions
npm install
cd ..
```

### 6. ตั้งค่า Environment Variables

แก้ไขไฟล์ `functions/.env` (มีอยู่แล้ว) หรือใช้คำสั่ง Firebase:

```bash
firebase functions:config:set \
  depa.api_base_url="https://aitransformapi.depa.or.th" \
  depa.api_key="YOUR_API_KEY_HERE"
```

**สำคัญ:** API Key ถูกเก็บไว้ที่ `functions/.env` แล้ว แต่ถ้าจะ deploy ขึ้น Firebase ให้ใช้คำสั่งด้านบน

## การรันในเครื่อง (Local Development)

### รัน Firebase Emulators

```bash
firebase emulators:start
```

เว็บไซต์จะรันที่: `http://localhost:5000`
Functions จะรันที่: `http://localhost:5001`

### หรือรันแค่ Functions

```bash
cd functions
npm run serve
```

## การ Deploy ขึ้น Firebase

### Deploy ทั้งหมด (Hosting + Functions)

```bash
firebase deploy
```

### Deploy แค่ Hosting

```bash
firebase deploy --only hosting
```

### Deploy แค่ Functions

```bash
firebase deploy --only functions
```

## API Endpoints

ระบบมี 3 API endpoints หลัก:

### 1. บันทึกการใช้งาน Voucher

```
POST /api/submit-usage

Body:
{
  "accessDate": "2025-11-27",
  "voucherCode": "DV-YNGX5FG9N2",
  "appUserId": "2845",
  "accessCount": 7,
  "accessTime": 399
}
```

### 2. ดึงรายการ Voucher

```
GET /api/get-vouchers?pageNumber=1&pageSize=500
```

### 3. ตรวจสอบการใช้งาน Voucher

```
POST /api/get-usage

Body:
{
  "voucherCode": "DV-YNGX5FG9N2",
  "fromDate": "2025-11-01",
  "toDate": "2025-11-27"
}
```

## การใช้งานเว็บไซต์

### หน้าบันทึกข้อมูล (index.html)

1. เปิดเว็บไซต์
2. กรอกข้อมูลการใช้งาน:
   - **วันที่ใช้งาน**: เลือกวันที่ (จะตั้งเป็นวันนี้อัตโนมัติ)
   - **รหัส Voucher**: เช่น DV-YNGX5FG9N2
   - **App User ID**: เช่น 2845
   - **จำนวนครั้งที่ใช้งาน**: เช่น 7
   - **ระยะเวลา (นาที)**: เช่น 399
3. กดปุ่ม "บันทึกข้อมูล"
4. ระบบจะส่งข้อมูลไป DEPA API โดยอัตโนมัติ

### หน้าตรวจสอบการใช้งาน (check-usage.html)

1. กรอก Voucher Code ที่หน้าบันทึกข้อมูล
2. กดปุ่ม "ตรวจสอบการใช้งาน"
3. จะเปิดหน้าใหม่แสดงประวัติการใช้งานในเดือนปัจจุบัน

## การเปลี่ยนเป็น Production Mode

ในไฟล์ `functions/index.js` มีการตั้งค่า `isProduction: false` อยู่ 2 จุด:

1. บรรทัด 26 - ใน endpoint `/submit-usage`
2. บรรทัด 119 - ใน endpoint `/get-usage`

เมื่อพร้อมใช้งานจริง เปลี่ยนเป็น `isProduction: true`

## Environment Variables

ไฟล์ `functions/.env` มีค่าต่อไปนี้:

```
DEPA_API_BASE_URL=https://aitransformapi.depa.or.th
DEPA_API_KEY=f1b53b63-1fc4-48dc-9b7f-3b912f0b79a4
```

**หมายเหตุ:** ไฟล์ `.env` ถูก ignore โดย git แล้ว (ดูใน `.gitignore`) เพื่อความปลอดภัย

## การตั้งค่าเพิ่มเติม

### เปิดใช้งาน Blaze Plan (ถ้าจำเป็น)

Firebase Functions ที่เรียก external API จำเป็นต้องใช้ Blaze Plan (Pay-as-you-go) แต่มี free tier ให้ใช้งานฟรี:
- Cloud Functions: 2 ล้านครั้ง/เดือน
- Hosting: 10 GB/เดือน

อัพเกรดที่: [Firebase Console](https://console.firebase.google.com/) > Project Settings > Usage and billing

### ตั้งค่า CORS (ถ้าเจอปัญหา)

ไฟล์ `functions/index.js` มีการตั้งค่า CORS แล้วที่บรรทัด 7:

```javascript
app.use(cors({ origin: true }));
```

## คำแนะนำและข้อควรระวัง

1. **API Key**: อย่าแชร์ API Key กับคนอื่น และอย่า commit ไฟล์ `.env` ขึ้น git
2. **Production Mode**: อย่าลืมเปลี่ยน `isProduction: true` เมื่อใช้งานจริง
3. **App User ID**: ควรมีระบบจัดการ User ID ของคุณเอง (อาจจะเก็บใน Database)
4. **Backup**: ควรเก็บข้อมูลสำรองไว้ก่อนส่ง API (อาจใช้ Firestore)

## Troubleshooting

### ปัญหา: Functions ไม่ทำงาน

```bash
# ดู logs
firebase functions:log
```

### ปัญหา: CORS Error

ตรวจสอบว่า Firebase Project มีการเปิดใช้งาน Functions แล้ว

### ปัญหา: Environment Variables ไม่ทำงาน

ถ้า deploy แล้วไม่เจอ env variables ให้ใช้:

```bash
firebase functions:config:set depa.api_key="YOUR_KEY"
firebase deploy --only functions
```

## License

MIT License - ใช้งานได้อย่างอิสระ

## ติดต่อ

หากมีปัญหาหรือข้อสงสัย สามารถแก้ไขโค้ดได้เลย หรือเพิ่มฟีเจอร์ตามต้องการ

---

**สร้างโดย:** Claude Code
**วันที่:** 2025-11-28
