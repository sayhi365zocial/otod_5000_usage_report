const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const DEPA_API_BASE_URL = process.env.DEPA_API_BASE_URL || 'https://aitransformapi.depa.or.th';
const DEPA_API_KEY = process.env.DEPA_API_KEY;

// ฟังก์ชันสำหรับบันทึกการใช้งาน Voucher
app.post('/submit-usage', async (req, res) => {
  try {
    const { accessDate, voucherCode, appUserId, accessCount, accessTime } = req.body;

    // Validate input
    if (!accessDate || !voucherCode || !appUserId || !accessCount || !accessTime) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // เตรียมข้อมูลสำหรับส่งไป DEPA API
    const payload = {
      isProduction: true,
      vouchers: [
        {
          accessDate,
          voucherCode,
          appUserId,
          accessCount: parseInt(accessCount),
          accessTime: parseInt(accessTime),
          lat: 0,
          lon: 0
        }
      ]
    };

    // เรียก DEPA API
    const response = await fetch(`${DEPA_API_BASE_URL}/api/dp/VoucherUsage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': DEPA_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    }

    return res.status(200).json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      data: data
    });

  } catch (error) {
    console.error('Error submitting usage:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
});

// ฟังก์ชันสำหรับดึงรายการ Voucher (รวม appUserId จาก Firestore)
app.post('/get-vouchers', async (req, res) => {
  try {
    const pageNumber = parseInt(req.body.pageNumber) || 1;
    const pageSize = parseInt(req.body.pageSize) || 500;

    const response = await fetch(`${DEPA_API_BASE_URL}/api/dp/GetDPVouchers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': DEPA_API_KEY
      },
      body: JSON.stringify({ pageNumber, pageSize })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    }

    // ดึง appUserId จาก Firestore
    if (data.success && data.data && data.data.length > 0) {
      const voucherPromises = data.data.map(async (voucher) => {
        try {
          const doc = await db.collection('voucher_mappings').doc(voucher.voucherCode).get();
          if (doc.exists) {
            const mapping = doc.data();
            return { ...voucher, appUserId: mapping.appUserId };
          }
          return voucher;
        } catch (error) {
          console.error(`Error fetching mapping for ${voucher.voucherCode}:`, error);
          return voucher;
        }
      });

      data.data = await Promise.all(voucherPromises);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error getting vouchers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
});

// ฟังก์ชันสำหรับตรวจสอบการใช้งาน Voucher
app.post('/get-usage', async (req, res) => {
  try {
    const { voucherCode, fromDate, toDate } = req.body;

    if (!voucherCode || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ voucherCode, fromDate และ toDate'
      });
    }

    const payload = {
      voucherCode,
      fromDate,
      toDate,
      isProduction: true
    };

    const response = await fetch(`${DEPA_API_BASE_URL}/api/dp/GetVoucherUsage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': DEPA_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error getting usage:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
});

// ฟังก์ชันสำหรับบันทึก/อัพเดท Voucher Mapping
app.post('/save-voucher-mapping', async (req, res) => {
  try {
    const { voucherCode, appUserId, firstName, lastName, productName } = req.body;

    if (!voucherCode || !appUserId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ voucherCode และ appUserId'
      });
    }

    const mappingData = {
      voucherCode,
      appUserId,
      firstName: firstName || '',
      lastName: lastName || '',
      productName: productName || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('voucher_mappings').doc(voucherCode).set(mappingData, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      data: mappingData
    });

  } catch (error) {
    console.error('Error saving voucher mapping:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
});

// ฟังก์ชันสำหรับดึงข้อมูล Voucher Mapping
app.get('/get-voucher-mapping/:voucherCode', async (req, res) => {
  try {
    const { voucherCode } = req.params;

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ voucherCode'
      });
    }

    const doc = await db.collection('voucher_mappings').doc(voucherCode).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล'
      });
    }

    return res.status(200).json({
      success: true,
      data: doc.data()
    });

  } catch (error) {
    console.error('Error getting voucher mapping:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

exports.api = functions.https.onRequest(app);
