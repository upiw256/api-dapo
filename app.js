const express = require("express");
const app = express();
const axios = require("axios");
const port = 3000;
const cors = require('cors')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
app.use(cors({
  origin: "*"
}))
require('dotenv').config();

// Middleware untuk validasi barrier
function validateBarrier(req, res, next) {
  const barrier = process.env.X_BARRIER;
  const providedBarrier = req.header("X-Barrier"); // Ambil nilai barrier dari header 'X-Barrier'
    
  if (providedBarrier === barrier) {
    // Jika barrier sesuai, lanjutkan ke endpoint berikutnya
    next();
  } else {
    // Jika barrier tidak sesuai, kirim respons kesalahan
    res
      .status(401)
      .json({ message: "Anda tidak diizinkan mengakses endpoint ini." });
  }
}

// Middleware ini akan diterapkan pada setiap permintaan
app.use((req, res, next) => {
  validateBarrier(req, res, next);
});

// Endpoint pertama
app.get("/api/guru", async (req, res) => {
    const url = "http://www.localhost:5774/WebService/getGtk?npsn=20227907";
    const token = process.env.API_KEY;
    const headers = {
        'Authorization': `Bearer ${token}`
      };
  const response = await axios.get(url, {headers});
  const data = response.data;

  // Kirim data sebagai respons JSON
  res.json(data);
});
app.get("/api/sekolah", async (req, res) => {
    const url = "http://www.localhost:5774/WebService/getSekolah?npsn=20227907";
    const token = process.env.API_KEY;
    const headers = {
        'Authorization': `Bearer ${token}`
      };
  const response = await axios.get(url, {headers});
  const data = response.data;

  // Kirim data sebagai respons JSON
  res.json(data);
});
app.use(bodyParser.json());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Ambil token API dari variabel lingkungan
    const token = process.env.API_KEY;

    // Membuat header dengan token
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // URL API eksternal
    const apiURL = `http://www.localhost:5774/WebService/getPengguna?npsn=20227907`;

    // Lakukan permintaan GET ke API eksternal dengan header token
    const response = await axios.get(apiURL, { headers });

    const users = response.data; // Data pengguna dari API
    console.log(users)
    // Cari pengguna dengan username yang sesuai
    const user = users.rows.find((row) => row.username === username);

    if (!user) {
      return res.status(401).json({ 
        status:401,        
        message: "Username tidak ditemukan" });
    }

    // Bandingkan password yang diberikan dengan password yang disimpan dalam database
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Terjadi kesalahan saat memeriksa password" });
      }
      
      if (result) {
        return res.json({ 
          status:200,
          message: "Autentikasi berhasil",
          data:[{
            id_user: user.pengguna_id,
            id_ptk: user.ptk_id,
            username: user.username,
            name: user.nama,
            role: user.peran_id_str
          }]
         });
      } else {
        return res.status(401).json({ 
          status: 401,
          message: "Password salah" 
        });
      }
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data pengguna dari API" });
  }
});
app.get("/api/siswa", async (req, res) => {
  const nisn = req.query.nisn;
  const nama = req.query.nama;
  const url = `http://www.localhost:5774/WebService/getPesertaDidik?npsn=20227907`; // URL tetap

  const token = process.env.API_KEY;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await axios.get(url, { headers });
    const data = response.data;
    if (nisn) {
      // Jika parameter nisn ada, filter data siswa dengan NISN yang cocok
      const filteredData = data.rows.find((row) => row.nisn === nisn);
      console.log(filteredData.nama);
      if (filteredData) {
        res.json(filteredData);
      } else {
        res.status(404).json({ error: "Data siswa dengan NISN yang diberikan tidak ditemukan." });
      }
    } else if(nama) {
      // Jika parameter nama ada, filter data siswa berdasarkan nama yang mendekati
      const filteredData = data.rows.filter((row) => row.nama.toLowerCase().includes(nama.toLowerCase()));

      if (filteredData.length > 0) {
        res.json(filteredData);
      } else {
        res.status(404).json({ error: "Data siswa dengan nama yang mendekati tidak ditemukan." });
      }
    }else{
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan dalam mengambil data siswa." });
  }
});
app.get("/api/rombel", async (req, res) => {
    const url = "http://www.localhost:5774/WebService/getRombonganBelajar?npsn=20227907";
    const token = process.env.API_KEY;
    const headers = {
        'Authorization': `Bearer ${token}`
      };
  const response = await axios.get(url, {headers});
  const data = response.data;

  // Kirim data sebagai respons JSON
  res.json(data);
});


app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
