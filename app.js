const express = require("express");
const app = express();
// var db = require('./dbconn');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
// const upload = multer({ dest: 'uploads/' });
const authUser = require("./AuthUser");

const { PrismaClient } = require("@prisma/client");



const prisma = new PrismaClient();

const port = 3001;

// agar API bisa dia kses
const cors = require("cors");
// const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // hanya FE kamu yang boleh akses
}));

const path = require("path");
const { log } = require("console");

const secretKey = "hkalshd9832yhui234hg234gjksdfsdnbnsvoisdsii";

// Setup penyimpanan file ke folder 'uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/ktp/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `ktp_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const storageProduk = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "img/product/");
  },
  filename: function (req, file, cb) {
    // Ambil nama produk dari form body
    let namaProduk = req.body.nama || "produk";

    // Hilangkan spasi, huruf kecil semua, buang karakter aneh
    namaProduk = namaProduk
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Ambil ekstensi asli
    const ext = path.extname(file.originalname);

    // Buat nama file akhir
    const fileName = `${namaProduk}_${Date.now()}${ext}`;

    cb(null, fileName);
  },
});

const uploadProduk = multer({ storage: storageProduk });
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware untuk auth

function authenticateAdmin(req, res, next) {
  const token = req.headers["token"];
  if (token == null)
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    }); // Unauthorized

  jwt.verify(token, secretKey, (err, user) => {
    if (err)
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      }); // Forbidden
    req.user = user;
    if (user.role === 10) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      }); // Forbidden
    }
  });
}

// GET API

// RAJA ONGKIR

app.get("/rajaongkir/ongkir", async (req, res) => {
  const { province, city } = req.query;

  if (!province || !city) {
    return res
      .status(400)
      .json({ error: "province_id dan city_id wajib diisi" });
  }

  const headers = { key: process.env.ONGKIR_API_KEY };

  try {
    // 1. Get Provinsi
    const provResponse = await axios.get(
      `https://rajaongkir.komerce.id/api/v1/destination/province`,
      { headers }
    );

    console.log(provResponse.data);

    const provinsi = provResponse.data.find((p) => p.id == province_id);

    // 2. Get Kota
    // const cityResponse = await axios.get(
    //   `https://rajaongkir.komerce.id/api/v1/destination/city/${province_id}`,
    //   { headers }
    // );
    // const kota = cityResponse.data.find(k => k.id == city_id);

    // // 3. Get Kecamatan
    // const districtResponse = await axios.get(
    //   `https://rajaongkir.komerce.id/api/v1/destination/district/${city_id}`,
    //   { headers }
    // );
    // const kecamatan = districtResponse.data;

    // res.json({
    //   provinsi,
    //   kota,
    //   kecamatan,
    // });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil data wilayah" });
  }
});

app.get("/rajaongkir/province", async (req, res) => {
  try {
    const response = await axios.get(
      `https://rajaongkir.komerce.id/api/v1/destination/province`,
      {
        headers: { key: process.env.ONGKIR_API_KEY },
      }
    );
    console.log(response.data);

    // res.json(response.data.rajaongkir.results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal ambil provinsi" });
  }
});

// ➤ Ambil kota berdasarkan ID provinsi
app.get("/rajaongkir/city", async (req, res) => {
  const { province_id } = req.query;
  try {
    const response = await axios.get(
      `https://rajaongkir.komerce.id/api/v1/destination/city/${province_id}`,
      {
        headers: { key: process.env.ONGKIR_API_KEY },
        // params: { province: province_id },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal ambil kota" });
  }
});

app.get("/rajaongkir/district", async (req, res) => {
  const { city_id } = req.query;
  console.log(city_id);

  try {
    const response = await axios.get(
      `https://rajaongkir.komerce.id/api/v1/destination/district/${city_id}`,
      {
        headers: { key: process.env.ONGKIR_API_KEY },
        // params: { province: province_id },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal ambil kota" });
  }
});

// ➤ Cek ongkir (POST)
app.post("/rajaongkir/cost", async (req, res) => {
  const { origin, destination, weight, courier } = req.body;
  try {
    const response = await axios.post(
      `${BASE_URL}/cost`,
      new URLSearchParams({
        origin,
        destination,
        weight,
        courier,
      }),
      {
        headers: {
          key: API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    res.json(response.data.rajaongkir.results);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Gagal cek ongkir" });
  }
});

//
app.get("/", (req, res) => {
  res.send("API Connected");
});

// API untuk mendapatkan file gambar
app.get("/pict/:id_product/:filename", (req, res) => {
  const { id_product, filename } = req.params;

  // Tentukan path file gambar berdasarkan ID product dan nama file
  const filePath = path.join(__dirname, "img", "product", id_product, filename);

  // Cek apakah file ada
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(404).json({
        success: false,
        message: "File tidak ditemukan",
      });
    }
  });
});

app.get("/api/v1/users/:id", async (req, res) => {
  const { id } = req.params;

  const user = await prisma.users.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      telp: true,
      nama_toko: true,
      klasifikasi_toko: true,
      rating_toko: true,
      buka_toko: true,
      alamat: {
        select: {
          id: true,
          provinsi: true,
          kabupaten: true,
          kecamatan: true,
          desa: true,
          kode_pos: true,
          detail: true,
          catatan: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).send({
      success: false,
      message: "User tidak ditemukan",
    });
  }

  res.json(user);
});

app.get("/api/v1/prov", async (req, res) => {
  const prov = await prisma.provinsi.findMany({
    select: {
      kode: true,
      nama: true,
    },
  });

  return res.status(200).send({
    success: true,
    data: prov,
  });
});

app.get("/api/v1/kab/:kode_prov", async (req, res) => {
  const { kode_prov } = req.params;

  const kab = await prisma.kabupaten.findMany({
    select: {
      kode: true,
      nama: true,
    },
    where: {
      kodeProv: kode_prov,
    },
  });

  return res.status(200).send({
    success: true,
    data: kab,
  });
});

app.get("/api/v1/kec/:kode_prov/:kode_kab", async (req, res) => {
  const { kode_prov, kode_kab } = req.params;
  console.log(req.params);

  const kec = await prisma.kecamatan.findMany({
    select: {
      kode: true,
      nama: true,
    },
    where: {
      kodeProv: kode_prov,
      kodeKab: kode_kab,
    },
  });

  return res.status(200).send({
    success: true,
    data: kec,
  });
});

app.get("/api/v1/desa/:kode_prov/:kode_kab/:kode_kec", async (req, res) => {
  const { kode_prov, kode_kab, kode_kec } = req.params;
  console.log(req.params);

  const desa = await prisma.desa.findMany({
    select: {
      kode: true,
      nama: true,
    },
    where: {
      kodeProv: kode_prov,
      kodeKab: kode_kab,
      kodeKec: kode_kec,
    },
  });

  return res.status(200).send({
    success: true,
    data: desa,
  });
});

app.get("/api/v1/alamat/:id_user", async (req, res) => {
  const { id_user } = req.params;

  console.log(id_user);

  const alamat = await prisma.alamat.findMany({
    where: {
      userId: parseInt(id_user),
    },
    select: {
      id: true,
      id: true,
      detail: true,
      is_default: true,
      nama: true,
      bangunan: true,
      notelp: true,
      is_toko: true,
      provinsi: {
        select: { nama: true },
      },
      kabupaten: {
        select: { nama: true },
      },
      kecamatan: {
        select: { nama: true },
      },
      desa: {
        select: { nama: true },
        select: { nama: true },
      },
      kodePos: true,
    },
  });

  return res.status(200).send({
    success: true,
    data: alamat,
  });
});

app.get("/api/v1/users", async (req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      telp: true,
      nama_toko: true,
      klasifikasi_toko: true,
      rating_toko: true,
      buka_toko: true,
    },
  });
  res.json(users);
});

app.get("/api/v1/product", async (req, res) => {
  try {
    const { total, page, orderBy, keyword, idToko } = req.query;

    const keywordTrimmed = keyword ? keyword.trim() : undefined;

    let order = {};
    if (orderBy === "harga_desc") {
      order = { harga: "desc" };
    } else if (orderBy === "harga_asc") {
      order = { harga: "asc" };
    }

    let totalQ = parseInt(total) || 10;
    let pageQ = parseInt(page) || 1;

    // Hitung total hasil pencarian
    const totalData = await prisma.product.count({
      where: {
        nama: keywordTrimmed
          ? {
              contains: keywordTrimmed,
              mode: "insensitive",
            }
          : undefined,
        userId: idToko ? parseInt(idToko) : undefined,
      },
    });

    // Hitung skip, jika skip melebihi total data, kembalikan data kosong
    const skip = (pageQ - 1) * totalQ;
    if (skip >= totalData) {
      return res.status(200).send({
        success: true,
        message: "Req berhasil",
        data: [],
      });
    }

    const result = await prisma.product.findMany({
      select: {
        id: true,
        nama: true,
        path: true,
        kategori: true,
        user: {
          select: {
            nama_toko: true,
            rating_toko: true,
          },
        },
        variasi: {
          select: {
            harga: true,
            stok: true,
          },
          // take: 1,
        },
      },
      take: totalQ,
      skip: skip,
      where: {
        nama: keywordTrimmed
          ? {
              contains: keywordTrimmed,
              mode: "insensitive",
            }
          : undefined,
        userId: idToko ? parseInt(idToko) : undefined,
      },
    });

    // Urutkan jika orderBy harga diberikan
    if (orderBy === "harga_desc" || orderBy === "harga_asc") {
      result.sort((a, b) => {
        const hargaA = a.variasi[0]?.harga ?? 0;
        const hargaB = b.variasi[0]?.harga ?? 0;
        return orderBy === "harga_desc" ? hargaB - hargaA : hargaA - hargaB;
      });
    }

    return res.status(200).send({
      success: true,
      message: "Req berhasil",
      data: result,
      totalData,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "terjadi kesalahan",
    });
  }
});

app.get("/api/v1/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            nama_toko: true,
            rating_toko: true,
            telp: true,
          },
        },
        variasi: {
          select: {
            id: true,
            nama: true,
            harga: true,
            stok: true,
            path: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product tidak ditemukan",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Req berhasil",
      data: product,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "terjadi kesalahan",
    });
  }
});

app.get("/api/v1/toko", async (req, res) => {
  try {
    const { total, page, orderBy, keyword, klasifikasi } = req.query;

    const keywordTrimmed = keyword ? keyword.trim() : undefined;

    let order = {};
    if (orderBy == "rating_desc") {
      order = { rating_toko: "desc" };
    } else if (orderBy == "rating_asc") {
      order = { rating_toko: "asc" };
    }

    let totalQ = parseInt(total) || 10;
    let pageQ = parseInt(page) || 1;

    // Hitung total hasil pencarian
    const totalData = await prisma.users.count({
      where: {
        buka_toko: 1,
        nama_toko: keywordTrimmed
          ? {
              contains: keywordTrimmed,
              mode: "insensitive",
            }
          : undefined,
        klasifikasi_toko: klasifikasi
          ? {
              contains: klasifikasi,
              mode: "insensitive",
            }
          : undefined,
      },
    });

    // Hitung skip, jika skip melebihi total data, kembalikan data kosong
    const skip = (pageQ - 1) * totalQ;
    if (skip >= totalData) {
      return res.status(200).send({
        success: true,
        message: "Req berhasil",
        data: [],
      });
    }

    const result = await prisma.users.findMany({
      select: {
        id: true,
        nama_toko: true,
        rating_toko: true,
        klasifikasi_toko: true,
        buka_toko: true,
        alamat: {
          where: {
            is_toko: 1,
          },
          select: {
            provinsi: true,
            kabupaten: true,
            kecamatan: true,
            desa: true,
            kode_pos: true,
            detail: true,
          },
        },
      },
      where: {
        buka_toko: 1,
        nama_toko: keywordTrimmed
          ? {
              contains: keywordTrimmed,
              mode: "insensitive",
            }
          : undefined,
        klasifikasi_toko: klasifikasi
          ? {
              contains: klasifikasi,
              mode: "insensitive",
            }
          : undefined,
      },
      take: totalQ,
      skip: skip,
      orderBy: order,
    });

    return res.status(200).send({
      success: true,
      message: "Req berhasil",
      data: result,
      totalData,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "terjadi kesalahan",
    });
  }
});

app.get("/api/v1/detail_pengajuan/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const toko = await prisma.users.findFirst({
      where: {
        id: id,
      },
      select: {
        nama_toko: true,
        klasifikasi_toko: true,
        rating_toko: true,
        status_pengajuan: true,
        time_terima: true,
        time_pengajuan: true,
        path_file: true,
      },
    });

    return res.status(200).send({
      success: true,
      message: "Req berhasil",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "terjadi kesalahan",
    });
  }
});

app.get("/api/v1/toko/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const toko = await prisma.users.findFirst({
      where: {
        id: parseInt(id),
      },
      select: {
        nama_toko: true,
        klasifikasi_toko: true,
        rating_toko: true,
        alamat: {
          where: {
            AND: [{ is_toko: 1 }, { is_default: 1 }],
          },
          select: {
            //default alamat
            id: true,
            kabupaten: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
    });
    // console.log(toko);

    return res.status(200).send({
      success: true,
      message: "Req berhasil",
      data: toko,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "terjadi kesalahan",
    });
  }
});

app.get("/api/v1/top_toko", async (req, res) => {
  try {
    // const { userId } = req.query;

    // console.log(req.query);

    const topToko = await prisma.users.findMany({
      select : {
        id: true,
        nama_toko: true,
        rating_toko: true,
        klasifikasi_toko: true,
        path_file: true,
        alamat: {
          where: {
            is_toko: 1,
          },
          select: {
            id: true,
            kabupaten: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
      where: {
        buka_toko: 1,
      },
      take: 2,
      orderBy: {
        rating_toko: "asc",
      },
    });
    // console.log(allUserCart);

    return res.status(200).send({
      success: true,
      message: "Req Berhasil",
      data: topToko,
    });
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      error: error,
    });
  }
});

app.get("/api/v1/cart", authUser, async (req, res) => {
  try {
    const { userId } = req.query;

    console.log(req.query);

    const allUserCart = await prisma.cart.findMany({
      where: {
        userId: parseInt(userId),
      },
      select: {
        quantity: true,
        time: true,
        product: {
          select: {
            id: true,
            nama: true,
            path: true,
            user: {
              select: {
                id: true,
                nama_toko: true,
                rating_toko: true,
                klasifikasi_toko: true,
                buka_toko: true,
              },
            },
          },
        },
        variasi: {
          select: {
            harga: true,
            stok: true,
            nama: true,
          },
        },
      },
    });
    console.log(allUserCart);

    return res.status(200).send({
      success: true,
      message: "Req Berhasil",
      data: allUserCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      error: error,
    });
  }
});

app.get("/api/v1/pengajuan", authenticateAdmin, async (req, res) => {
  try {
    const pengajuan = await prisma.users.findMany({
      where: { status_pengajuan: 1 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        nama_toko: true,
        telp: true,
        klasifikasi_toko: true,
        time_pengajuan: true,
        status_pengajuan: true,
        path_file: true,
        alamat: {
          where: { is_toko: 1 }, // hanya alamat toko
          select: {
            id: true,
            provinsi: true,
            kabupaten: true,
            kecamatan: true,
            desa: true,
            kode_pos: true,
            detail: true,
            catatan: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Req Berhasil",
      data: pengajuan,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.get("/api/v1/transaksi", async (req, res) => {
  try {
    const { tokoId } = req.query;
    console.log(req.query);

    if (tokoId) {
      // Jika tokoId diberikan, ambil semua transaksi untuk toko tersebut
      const transaksi = await prisma.transaksi.findMany({
        where: { tokoId: parseInt(tokoId) },
        select: {
          id: true,
          time: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          harga : true,
          status: true,
          listIdProduk: true,
          toko: {
            select: {
              rek_toko: true,
              an_rek: true,
              nama_toko: true,
              telp: true,
            },
          },
        },
      });
      return res.status(200).json({
        success: true,
        message: "Req Berhasil",
        data: transaksi,
      });
    } else if (productId && transaksiId) {
      // Jika hanya productId diberikan, ambil semua transaksi untuk produk tersebut
      const transaksi = await prisma.transaksi.findMany({
        where: {
          productId: parseInt(productId),
          transaksiId: parseInt(transaksiId),
        },
        include: {
          product: {
            select: {
              nama: true,
              harga: true,
              stock: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
      return res.status(200).json({
        success: true,
        message: "Req Berhasil",
        data: transaksi,
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.get("/api/v1/review/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(req.params);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Parameter productId tidak ditemukan",
      });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(productId) },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            path_file: true,
          },
        },
      },
      orderBy: { time: "desc" }, // Urutkan berdasarkan waktu review terbaru
    });

    return res.status(200).json({
      success: true,
      message: "Req Berhasil",
      data: reviews,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

// POST API

app.post("/api/v1/review", async (req, res) => {
  const { userId, productId, rating, review } = req.body;

  try {
    // Cek apakah user ada
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Cek apakah produk ada
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    // Buat review baru
    const newReview = await prisma.review.create({
      data: {
        userId: parseInt(userId),
        productId: parseInt(productId),
        rating: parseFloat(rating),
        review: review,
        time: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Review berhasil ditambahkan",
      data: newReview,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/register", async (req, res) => {
  const { firstName, lastName, email, pass } = req.body;
  console.log(req.body);

  if (!firstName || !lastName || !email || !pass) {
    return res.status(400).json({
      success: false,
      message: "Data tidak lengkap",
    });
  }

  const hashedPass = await bcrypt.hash(pass, 10);

  const user = await prisma.users.create({
    data: { firstName, lastName, email, password: hashedPass },
  });

  console.log("user created:", user);

  res.status(200).json({
    success: true,
    user,
  });
});

app.post("/api/v1/transaksi", async (req, res) => {
  try {
    const { userId, tokoId, harga, listIdProduk, status, time } = req.body;

    console.log(req.body);
    

    // Buat transaksi baru
    const transaksi = await prisma.transaksi.create({
      data: {
        userId: parseInt(userId),
        status : status,
        tokoId : tokoId,
        harga : harga,
        time : time,
        listIdProduk : listIdProduk,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Transaksi berhasil dibuat",
      data: transaksi.id,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/alamat", async (req, res) => {
  const {
    userId,
    kodeProv,
    kodeKab,
    kodeKec,
    kodeDesa,
    detail,
    catatan,
    kode_pos,
    is_toko,
    is_default,
    bangunan,
    nama,
    notelp,
  } = req.body;

  console.log(req.body);

  try {
    const alamatBaru = await prisma.alamat.create({
      data: {
        userId,
        kodeProv,
        kodeKab,
        kodeKec,
        kodeDesa,
        detail,
        catatan,
        bangunan,
        nama,
        notelp: notelp,
        kodePos: kode_pos,
        is_toko,
        is_default,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Alamat berhasil ditambahkan",
      data: alamatBaru,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/alamat/toko", async (req, res) => {
  const { userId, alamatId } = req.body;

  try {
    // Hapus status toko dari semua alamat user
    await prisma.alamat.updateMany({
      where: { userId: parseInt(userId) },
      data: { is_toko: 0 },
    });

    // Set alamat yang dipilih sebagai toko
    const updatedAlamat = await prisma.alamat.update({
      where: { id: parseInt(alamatId) },
      data: { is_toko: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "Alamat toko berhasil diupdate",
      data: updatedAlamat,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/alamat/default", async (req, res) => {
  const { userId, alamatId } = req.body;

  try {
    // Hapus status default dari semua alamat user
    await prisma.alamat.updateMany({
      where: { userId: parseInt(userId) },
      data: { is_default: 0 },
    });

    // Set alamat yang dipilih sebagai default
    const updatedAlamat = await prisma.alamat.update({
      where: { id: parseInt(alamatId) },
      data: { is_default: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "Alamat default berhasil diupdate",
      data: updatedAlamat,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    // console.log("valid");

    // const hashedPass = await bcrypt.hash(password, 10);
    const uniqueUser = await prisma.users.findFirst({
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        telp: true,
        buka_toko: true,
        nama_toko: true,
        klasifikasi_toko: true,
        rating_toko: true,
        gender: true,
        tanggal_lahir: true,
        path_file: true,
      },
      where: {
        email: email,
      },
    });

    if (!uniqueUser) {
      // Kalo misalnya email gaada
      return res.status(200).send({
        message: "error email",
      });
    } else {
      const isValidPassword = await bcrypt.compare(
        password,
        uniqueUser.password
      );

      if (isValidPassword) {
        const info = {
          id: uniqueUser.id,
          firstName: uniqueUser.firstName,
          lastName: uniqueUser.lastName,
          email: uniqueUser.email,
          role: uniqueUser.role,
          telp: uniqueUser.telp,
          nama_toko: uniqueUser.nama_toko,
          buka_toko: uniqueUser.buka_toko,
          klasifikasi_toko: uniqueUser.klasifikasi_toko,
          rating_toko: uniqueUser.rating_toko,
        };

        // TOKEN
        const token = jwt.sign(info, secretKey);

        // console.log(token);

        return res.status(200).send({
          success: true,
          message: "Login Success",
          id_user: uniqueUser.id,
          token: token,
          role: uniqueUser.role,
          firstname: uniqueUser.firstName,
          lastname: uniqueUser.lastName,
          email: uniqueUser.email,
          gender: uniqueUser.gender,
          tanggal_lahir: uniqueUser.tanggal_lahir,
          telp: uniqueUser.telp,
          nama_toko: uniqueUser.nama_toko,
          buka_toko: uniqueUser.buka_toko,
          klasifikasi_toko: uniqueUser.klasifikasi_toko,
          rating_toko: uniqueUser.rating_toko,
          path_file: uniqueUser.path_file,
        });

        // setTimeout(() => {
        //     res.status(200).json({
        //         success: true,
        //         message: "Login Success",
        //         token: token,
        //     });
        // }, 5000);
      } else {
        return res.status(200).json({
          success: false,
          message: "Salah Password",
          ß,
        });
      }
    }
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Terjadi Kesalahan",
      error: error,
    });
  }
});

app.post("/api/v1/acc_transaksi", async (req, res) => {
  try {
    const { transaksiId, no_resi } = req.body; 
    console.log(req.body);  
    // Cek apakah transaksi ada
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: parseInt(transaksiId) },
    });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }
    // Update status transaksi
    const updatedTransaksi = await prisma.transaksi.update({
      where: { id: parseInt(transaksiId) },
      data: { 
        status: 1,
        no_resi: no_resi,
      },
    }); 
    return res.status(200).json({
      success: true,
      message: "Status transaksi berhasil diupdate",
      data: updatedTransaksi,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/pengajuan", upload.single("ktp"), async (req, res) => {
  try {
    const {
      userId,
      nama_toko,
      telp,
      klasifikasi_toko,
      kode_pos,
      provinsi,
      kabupaten,
      kecamatan,
      desa,
      catatan,
      detail,
    } = req.body;

    const ktpFile = req.file;

    if (!ktpFile) {
      return res.status(400).json({
        success: false,
        message: "File KTP wajib diunggah",
      });
    }

    // Cek apakah user sudah mengajukan sebelumnya
    const existingRequest = await prisma.users.findFirst({
      where: { status_pengajuan: 1, id: parseInt(userId) },
      select: { id: true, status_pengajuan: true },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "User sudah mengajukan pembukaan toko sebelumnya",
      });
    }

    // Simpan pengajuan dan file path KTP (opsional: simpan nama file di kolom 'ktp')
    const createPengajuan = await prisma.users.update({
      data: {
        time_pengajuan: new Date(),
        time_terima: null,
        status_pengajuan: 1,
        acc_by: null,
        nama_toko: nama_toko,
        telp: telp,
        buka_toko: 1,
        klasifikasi_toko: parseInt(klasifikasi_toko),
        ktp_path: ktpFile.filename, // pastikan ada kolom di database kalau ini digunakan
      },
      where: { id: parseInt(userId) },
    });

    return res.status(200).json({
      success: true,
      message: "Pengajuan pembukaan toko berhasil",
      file_url: `/uploads/${ktpFile.filename}`,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error.message,
    });
  }
});

app.post("/api/v1/add_to_cart", async (req, res) => {
  const { userId, productId, quantity, variasiId } = req.body;
  console.log(req.body);

  try {
    // Cek apakah user sudah ada di cart
    const existingCart = await prisma.cart.findFirst({
      where: {
        userId: parseInt(userId),
        productId: parseInt(productId),
      },
    });

    if (existingCart) {
      // Jika sudah ada, update quantity
      const updatedCart = await prisma.cart.update({
        where: { id: existingCart.id },
        data: {
          quantity: existingCart.quantity + parseInt(quantity),
          variasiId: variasiId,
          time: new Date(),
        },
      });
      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        data: updatedCart,
      });
    } else {
      // Jika belum ada, buat entry baru di cart
      const newCart = await prisma.cart.create({
        data: {
          userId: parseInt(userId),
          productId: parseInt(productId),
          quantity: parseInt(quantity),
          variasiId: variasiId,
          time: new Date(),
        },
      });
      return res.status(201).json({
        success: true,
        message: "Product added to cart successfully",
        data: newCart,
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/register", async (req, res) => {
  try {
    const { firstName, lastName, password, email } = req.body;
    // console.log(req.body);

    if (!firstName || !lastName || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap",
      });
    }

    // Cek email dulu
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: 1,
        password: hashedPass,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User berhasil didaftarkan",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/pengajuan/acc", authenticateAdmin, async (req, res) => {
  try {
    const { userId, acc } = req.body;

    // Cek apakah user ada
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(userId),
        status_pengajuan: 1, // hanya ambil user yang sedang mengajukan
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Update status pengajuan
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: {
        status_pengajuan: acc ? 2 : 99, // 2 untuk diterima, 99 untuk ditolak
        acc_by: acc ? req.user.id : null, // Simpan ID admin yang meng-acc
        time_terima: acc ? new Date() : null, // Set waktu terima jika diterima
        buka_toko: acc ? 1 : 0, // Set buka_toko jika diterima
      },
    });

    return res.status(200).json({
      success: true,
      message: acc ? "Pengajuan diterima" : "Pengajuan ditolak",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.post("/api/v1/product", uploadProduk.any(), async (req, res) => {
  try {
    console.log("tambah produk");

    console.log(req.body);
    console.log(req.files);

    const { nama, deskripsi, userId, kategori = 0 } = req.body;
    const parsedVariasi = JSON.parse(req.body.variasi || "[]");
    req.files.forEach((file) => {
      console.log("FIELDNAME:", file.fieldname);
    });
    console.log(req.files);

    // Langkah 1: Simpan produk dulu
    const product = await prisma.product.create({
      data: {
        nama,
        desc: deskripsi,
        userId: parseInt(userId),
        kategori: parseInt(kategori),
        path: "", // nanti diupdate setelah tahu path gambar utama
      },
    });

    const idProduk = product.id;

    const folderFinal = `img/product/${idProduk}`;
    if (!fs.existsSync(folderFinal)) {
      fs.mkdirSync(folderFinal, { recursive: true });
    }

    let fileUtamaPath = [];
    const variasiData = [];
    let fileIndex = 0;

    req.files.forEach((file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const finalFileName = `${fileIndex}${ext}`;
      const finalPath = `${folderFinal}/${finalFileName}`;

      fs.renameSync(file.path, finalPath);

      if (file.fieldname === "files") {
        fileUtamaPath.push(`/${finalPath}`);
      } else {
        const match = file.fieldname.match(/variasi\[(\d+)\]\[file\]/);
        if (match) {
          const index = parseInt(match[1]);
          const v = parsedVariasi[index];
          if (v) {
            variasiData.push({
              productId: idProduk,
              nama: v.nama,
              harga: parseInt(v.harga),
              stok: parseInt(v.stok),
              path: JSON.stringify(`/${finalPath}`),
            });
          }
        }
      }

      fileIndex++;
    });

    console.log(fileUtamaPath);

    console.log("Isi variasiData:", variasiData);

    // Update produk dengan path gambar utama dan buat variasi
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        path: JSON.stringify(fileUtamaPath), // ← simpan array path jadi string JSON
      },
    });

    await prisma.variasi.createMany({
      data: variasiData,
    });

    res.json({ success: true, data: updatedProduct });
  } catch (err) {
    console.error("Gagal:", err);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk",
      error: err.message,
    });
  }
});

// DELETE API
app.delete("/api/v1/cart", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Cek apakah cart ada
    const existingCart = await prisma.cart.findFirst({
      where: {
        userId: parseInt(userId),
        productId: parseInt(productId),
      },
    });

    if (!existingCart) {
      return res.status(404).json({
        success: false,
        message: "Cart tidak ditemukan",
      });
    }

    // Hapus cart
    await prisma.cart.delete({
      where: { id: existingCart.id },
    });

    return res.status(200).json({
      success: true,
      message: "Cart berhasil dihapus",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.delete("/api/v1/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah produk ada
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    // Hapus produk
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.delete("/api/v1/alamat/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Alamat dihapus : ", id);

    // Cek apakah review ada
    const existingReview = await prisma.alamat.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review tidak ditemukan",
      });
    }

    // Hapus review
    await prisma.alamat.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Alamat berhasil dihapus",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.delete("/api/v1/review/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah review ada
    const existingReview = await prisma.review.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review tidak ditemukan",
      });
    }

    // Hapus review
    await prisma.review.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Review berhasil dihapus",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

// PATCH API

app.patch("/api/v1/product/:id", uploadProduk.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, userId, kategori = 0 } = req.body;
    // console.log(req.body.variasi);
    
    console.log("Update produk dengan ID:", id);
    

    const parsedVariasi = JSON.parse(req.body.variasi || "[]");

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    // Ambil path media lama
    let fileUtamaPath = [];
    const fileUtamaBaru =
      req.files?.filter((f) => f.fieldname === "files") || [];

    // Jika ada file utama baru, hapus semua file lama dari folder & reset path
    if (fileUtamaBaru.length > 0) {
      try {
        // Ambil path lama
        const pathLama = JSON.parse(existingProduct.path);

        // Hapus semua file lama
        pathLama.forEach((p) => {
          const fullPath = path.join(__dirname, p); // Path absolut
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });

        fileUtamaPath = []; // Reset path untuk diisi ulang
      } catch (e) {
        console.error("Gagal parsing atau hapus path lama:", e);
      }
    }

    const folderFinal = `img/product/${id}`;
    if (!fs.existsSync(folderFinal)) {
      fs.mkdirSync(folderFinal, { recursive: true });
    }

    const variasiData = [];
    let fileIndex = 0;

    // Simpan file variasi terlebih dulu
    const fileMap = {};
    req.files?.forEach((file) => {
      const match = file.fieldname.match(/variasi\[(\d+)\]\[file\]/);
      const ext = path.extname(file.originalname).toLowerCase();
      const finalFileName = `${fileIndex}${ext}`;
      const finalPath = `${folderFinal}/${finalFileName}`;

      fs.renameSync(file.path, finalPath);
      fileIndex++;

      if (file.fieldname === "files") {
        fileUtamaPath.push(`/${finalPath}`);
      } else if (match) {
        const index = parseInt(match[1]);
        fileMap[index] = `/${finalPath}`;
      }
    });

    // Proses semua variasi (terlepas dari ada/tidaknya file)
    parsedVariasi.forEach((v, index) => {
      variasiData.push({
        productId: parseInt(id),
        nama: v.nama,
        harga: parseInt(v.harga),
        stok: parseInt(v.stok),
        path: JSON.stringify(fileMap[index] || null), // bisa null jika tidak ada file
      });
    });
    console.log("varasi baru : ", variasiData);

    // Update produk utama
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        nama,
        desc: deskripsi,
        userId: parseInt(userId),
        kategori: parseInt(kategori),
        path: JSON.stringify(fileUtamaPath),
      },
    });

    // Jika variasiData ada (berarti variasi dikirim ulang), hapus dan buat ulang
    if (variasiData.length > 0) {
      console.log("update variasi");

      await prisma.variasi.deleteMany({
        where: { productId: parseInt(id) },
      });

      await prisma.variasi.createMany({
        data: variasiData,
      });
    }

    res.json({
      success: true,
      message: "Produk berhasil diperbarui",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat update produk",
      error: error.message,
    });
  }
});

app.patch("/api/v1/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, telp, nama_toko, klasifikasi_toko } =
      req.body;

    // Cek apakah user ada
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        firstName,
        lastName,
        email,
        telp,
        nama_toko,
        klasifikasi_toko,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User berhasil diupdate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.patch("/api/v1/users/password/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Cek apakah user ada
    const existingUser = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Hash password baru
    const hashedPass = await bcrypt.hash(password, 10);

    // Update password user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        password: hashedPass,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password berhasil diupdate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi Kesalahan",
      data: error,
    });
  }
});

app.listen(port, () => {
  console.log("Server running on http://localhost:" + port);
});
