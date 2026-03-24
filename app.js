const express = require("express");
const axios = require("axios");
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 30000;

// Konfigurasi Dasar
const NPSN = "20227907";
const BASE_URL = process.env.BASE_URL || "http://192.168.10.2:5774/WebService"; // Hapus 'www' supaya tidak ECONNREFUSED

// Middleware
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// Middleware untuk validasi barrier (X-Barrier)
function validateBarrier(req, res, next) {
  const barrier = process.env.X_BARRIER;
  const providedBarrier = req.header("X-Barrier");
    
  if (providedBarrier === barrier) {
    next();
  } else {
    res.status(401).json({ 
      status: 401,
      message: "Akses ditolak! Kamu tidak punya izin (Barrier Salah)." 
    });
  }
}

// Terapkan barrier ke semua API
app.use(validateBarrier);

// Fungsi pembantu untuk ambil data dari WebService
async function fetchData(endpoint) {
  const token = process.env.API_KEY;
  const url = `${BASE_URL}/${endpoint}?npsn=${NPSN}`;
  
  const response = await axios.get(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

// 1. Endpoint Guru (GTK)
app.get("/api/guru", async (req, res) => {
  try {
    const data = await fetchData("getGtk");
    res.json(data);
  } catch (error) {
    console.error("Error Guru:", error.message);
    res.status(500).json({ error: "Gagal ambil data guru. Pastikan server port 5774 aktif!" });
  }
});

// 2. Endpoint Sekolah
app.get("/api/sekolah", async (req, res) => {
  try {
    const data = await fetchData("getSekolah");
    res.json(data);
  } catch (error) {
    console.error("Error Sekolah:", error.message);
    res.status(500).json({ error: "Gagal ambil data sekolah." });
  }
});

// 3. Endpoint Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = await fetchData("getPengguna");
    const user = users.rows.find((row) => row.username === username);

    if (!user) {
      return res.status(401).json({ status: 401, message: "Username tidak ditemukan" });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.status(500).json({ message: "Gagal cek password" });
      
      if (result) {
        return res.json({ 
          status: 200,
          message: "Halo! Kamu berhasil masuk.",
          data: [{
            id_user: user.pengguna_id,
            id_ptk: user.ptk_id,
            username: user.username,
            name: user.nama,
            role: user.peran_id_str
          }]
        });
      } else {
        return res.status(401).json({ status: 401, message: "Password salah, coba diingat lagi ya!" });
      }
    });
  } catch (error) {
    console.error("Error Login:", error.message);
    res.status(500).json({ error: "Terjadi gangguan koneksi saat login." });
  }
});

// 4. Endpoint Siswa (Filter NISN & Nama)
app.get("/api/siswa", async (req, res) => {
  const { nisn, nama } = req.query;

  try {
    const data = await fetchData("getPesertaDidik");
    
    if (!data || !data.rows) {
      return res.status(404).json({ error: "Data siswa kosong dari server pusat." });
    }

    if (nisn) {
      const filteredData = data.rows.find((row) => row.nisn === nisn);
      if (filteredData) {
        res.json(filteredData);
      } else {
        res.status(404).json({ error: `Siswa dengan NISN ${nisn} tidak ada.` });
      }
    } else if (nama) {
      const filteredData = data.rows.filter((row) => 
        row.nama && row.nama.toLowerCase().includes(nama.toLowerCase())
      );
      if (filteredData.length > 0) {
        res.json(filteredData);
      } else {
        res.status(404).json({ error: "Nama siswa tersebut tidak ditemukan." });
      }
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error("Error Siswa:", error.message);
    res.status(500).json({ error: "Gagal ambil data siswa. Cek koneksi server lokal kamu." });
  }
});

// 5. Endpoint Rombel
app.get("/api/rombel", async (req, res) => {
  try {
    const data = await fetchData("getRombonganBelajar");
    res.json(data);
  } catch (error) {
    console.error("Error Rombel:", error.message);
    res.status(500).json({ error: "Gagal ambil data rombel." });
  }
});

// Jalankan Server
app.listen(port, () => {
  console.log(`-------------------------------------------`);
  console.log(`Siap! Server jalan di http://localhost:${port}`);
  console.log(`Pastikan aplikasi di port 5774 juga menyala ya!`);
  console.log(`-------------------------------------------`);
});