const express = require('express');
const app = express();
// var db = require('./dbconn');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fsp = require('fs/promises');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const port = 3001

// agar API bisa dia kses
const cors = require('cors');
const path = require('path');

const secretKey = "hkalshd9832yhui234hg234gjksdfsdnbnsvoisdsii";

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware untuk auth

function authenticateAdmin(req, res, next) {
    const token = req.headers['token']
    if (token == null) return res.status(401).json({
                                success: false,
                                message: "Unauthorized",
                            }); // Unauthorized

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({
                                success: false,
                                message: "Forbidden",
                            }); // Forbidden
        req.user = user;
        if (user.role === 10){
            next();
        }else{
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            }); // Forbidden
        }
    });
}



// GET API

app.get('/', (req, res) => {
    res.send('API Connected');
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

app.get('/api/v1/users/:id', async (req, res) => {
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
                    catatan: true
                }
            }
        }
    });

    if (!user) {
        return res.status(404).send({
            success: false,
            message: "User tidak ditemukan"
        });
    }

    res.json(user);
});

app.get('/api/v1/users', async (req, res) => {
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
        }
    });
    res.json(users);
});

app.get('/api/v1/product', async (req, res) => {
    try {
        const { total, page, orderBy, keyword } = req.query;

        const keywordTrimmed = keyword ? keyword.trim() : undefined;

        let order = {};
        if (orderBy == "harga_desc") {
            order = { harga: 'desc' }
        } else if (orderBy == "harga_asc") {
            order = { harga: "asc" }
        }

        let totalQ = parseInt(total) || 10;
        let pageQ = parseInt(page) || 1;

        // Hitung total hasil pencarian
        const totalData = await prisma.product.count({
            where: {
                nama: keywordTrimmed ? {
                    contains: keywordTrimmed,
                    mode: 'insensitive'
                } : undefined
            }
        });

        // Hitung skip, jika skip melebihi total data, kembalikan data kosong
        const skip = (pageQ - 1) * totalQ;
        if (skip >= totalData) {
            return res.status(200).send({
                success: true,
                message: "Req berhasil",
                data: []
            });
        }

        const result = await prisma.product.findMany({
             select: {
                id: true,
                nama: true,
                path: true,
                user: {
                    select: {
                        nama_toko: true,
                        rating_toko: true
                    }
                },
                variasi: {
                    select: {
                        harga: true
                    },
                    take: 1 
                }
            },
            take: totalQ,
            skip: skip,
            orderBy: order,
            where: {
                // stock: { gt: 0 },
                nama: keywordTrimmed ? {
                    contains: keywordTrimmed,
                    mode: 'insensitive'
                } : undefined
            }
        });

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
            totalData
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "terjadi kesalahan"
        });
    }
});

app.get('/api/v1/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    select: {
                        nama_toko: true,
                        rating_toko: true,
                    }
                },
                variasi :{
                    select: {
                        nama : true,
                        harga: true,
                        stok: true,
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).send({
                success: false,
                message: "Product tidak ditemukan"
            });
        }

        return res.status(200).send({
            success: true,
            message: "Req berhasil",
            data: product
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "terjadi kesalahan"
        });
    }
}
);

app.get('/api/v1/toko', async (req, res) => {
    try {
        const { total, page, orderBy, keyword, klasifikasi,  } = req.query;

        const keywordTrimmed = keyword ? keyword.trim() : undefined;

        let order = {};
        if (orderBy == "rating_desc") {
            order = { rating_toko: 'desc' }
        } else if (orderBy == "rating_asc") {
            order = { rating_toko: "asc" }
        }

        let totalQ = parseInt(total) || 10;
        let pageQ = parseInt(page) || 1;

        // Hitung total hasil pencarian
        const totalData = await prisma.users.count({
            where: {
                buka_toko: 1,
                nama_toko: keywordTrimmed ? {
                    contains: keywordTrimmed,
                    mode: 'insensitive'
                } : undefined,
                klasifikasi_toko: klasifikasi ? {
                    contains: klasifikasi,
                    mode: 'insensitive'
                } : undefined
            }
        });

        
        // Hitung skip, jika skip melebihi total data, kembalikan data kosong
        const skip = (pageQ - 1) * totalQ;
        if (skip >= totalData) {
            return res.status(200).send({
                success: true,
                message: "Req berhasil",
                data: []
            });
        }

        const result = await prisma.users.findMany({
            select: {
                id: true,
                nama_toko: true,
                rating_toko: true,
                klasifikasi_toko: true,
                alamat_toko: true,
                buka_toko: true,
            },
            where: {
                buka_toko: 1,
                nama_toko: keywordTrimmed ? {
                    contains: keywordTrimmed,
                    mode: 'insensitive'
                } : undefined,
                klasifikasi_toko: klasifikasi ? {
                    contains: klasifikasi,
                    mode: 'insensitive'
                } : undefined
            },
            take: totalQ,
            skip: skip,
            orderBy: order,
        });

        return res.status(200).send({
            success: true,
            message: "Req berhasil",
            data: result,
            totalData
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "terjadi kesalahan"
        });
    }
});

app.get('/api/v1/cart', async (req, res) => {
    try {
        const {userId} = req.query;

        const allUserCart = await prisma.cart.findMany({
            where: {
                userId: parseInt(userId)
            },
            include: {
                product: {
                    select: {
                        nama: true,
                        harga: true,
                        path: true,
                        stock: true
                    },
                    where: {
                        stock : {gt:0}
                    }
                }
            }
        });

        return res.status(200).send({
            success: true,
            message: "Req Berhasil",
            data: allUserCart
        })

    }catch(error) {
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            error : error,
        });
    }
})

app.get('/api/v1/pengajuan', authenticateAdmin, async (req, res) => {
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
                path_file:true,
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
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Req Berhasil",
            data: pengajuan
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.get('/api/v1/transaksi', async (req, res) => {
    try{
        const { userId, productId, transaksiId } = req.query;

        if( !userId || (!productId && !transaksiId)) {
            return res.status(400).json({
                success: false,
                message: "Parameter tidak lengkap"
            });
        }

        if(transaksiId) {
            // Jika transaksiId diberikan, ambil transaksi tersebut
            const transaksi = await prisma.transaksi.findUnique({
                where: { id: parseInt(transaksiId) },
                include: {
                    product: {
                        select: {
                            nama: true,
                            harga: true,
                            stock: true
                        }
                    },user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
        }else if(productId && transaksiId) {
            // Jika hanya productId diberikan, ambil semua transaksi untuk produk tersebut
            const transaksi = await prisma.transaksi.findMany({
                where: { productId: parseInt(productId), transaksiId: parseInt(transaksiId) },
                include: {
                    product: {
                        select: {
                            nama: true,
                            harga: true,
                            stock: true
                        }
                    },
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Req Berhasil",
            data: transaksi
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.get('/api/v1/review', async (req, res) => {
    try {
        const { productId } = req.query;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Parameter productId tidak ditemukan"
            });
        }

        const reviews = await prisma.review.findMany({
            where: { productId: parseInt(productId) },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { time: 'desc' } // Urutkan berdasarkan waktu review terbaru
        });

        return res.status(200).json({
            success: true,
            message: "Req Berhasil",
            data: reviews
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
}
);



// POST API

app.post('/api/v1/review', async (req, res) => {
    const { userId, productId, rating, review } = req.body;

    try {
        // Cek apakah user ada
        const user = await prisma.users.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cek apakah produk ada
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
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
            }
        });

        return res.status(201).json({
            success: true,
            message: "Review berhasil ditambahkan",
            data: newReview
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
}
);

app.post('/api/v1/register', async (req, res) => {
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
        user
    });
});

app.post('/api/v1/transaksi', async (req, res) => {

    try {
    const {userId, productId, status } = req.body;
        // Cek apakah user ada
        const user = await prisma.users.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cek apakah produk ada
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        // Buat transaksi baru
        const transaksi = await prisma.transaksi.create({
            data: {
                userId: parseInt(userId),
                productId: parseInt(productId),
                status: status,
                time: new Date(),
            }
        });

        return res.status(201).json({
            success: true,
            message: "Transaksi berhasil dibuat",
            data: transaksi
        });
    }catch (error) { 
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }

});

app.post('/api/v1/alamat', async (req, res) => {

    const { userId, provinsi, kabupaten, kecamatan, desa, detail, catatan, kode_pos } = req.body;

    try {
        const alamat = await prisma.alamat.create({
            data: {
                userId: parseInt(userId),
                kode_pos,
                provinsi,
                kabupaten,
                kecamatan: kecamatan,
                desa,
                catatan,
                detail
            }
        });

        return res.status(200).json({
            success: true,
            message: "Alamat berhasil ditambahkan",
            data: alamat
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
}
);

app.post('/api/v1/alamat/toko', async (req, res) => {
    const { userId, alamatId } = req.body;

    try {
        // Hapus status toko dari semua alamat user
        await prisma.alamat.updateMany({
            where: { userId: parseInt(userId) },
            data: { is_toko: 0 }
        });

        // Set alamat yang dipilih sebagai toko
        const updatedAlamat = await prisma.alamat.update({
            where: { id: parseInt(alamatId) },
            data: { is_toko: 1 }
        });

        return res.status(200).json({
            success: true,
            message: "Alamat toko berhasil diupdate",
            data: updatedAlamat
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.post('/api/v1/alamat/default', async (req, res) => {
    const { userId, alamatId } = req.body;

    try {
        // Hapus status default dari semua alamat user
        await prisma.alamat.updateMany({
            where: { userId: parseInt(userId) },
            data: { is_default: 0 }
        });

        // Set alamat yang dipilih sebagai default
        const updatedAlamat = await prisma.alamat.update({
            where: { id: parseInt(alamatId) },
            data: { is_default: 1 }
        });

        return res.status(200).json({
            success: true,
            message: "Alamat default berhasil diupdate",
            data: updatedAlamat
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.post("/api/v1/login", async (req,res) => {
    
    try {     

        const {email, password} = req.body;
        console.log(req.body);
        
        
        
        // const hashedPass = await bcrypt.hash(password, 10);
        const uniqueUser = await prisma.users.findFirst({
            select : {
                id : true,
                email : true,
                password : true,
                firstName : true,
                lastName : true,
                role: true,
                telp : true,
                buka_toko: true,
                nama_toko:true,
                klasifikasi_toko: true,
                rating_toko: true,
            },
            where : {
                email : email,
            }
        });

        
        if (!uniqueUser){
            // Kalo misalnya email gaada
            return res.status(200).send({
                message : "error email",
            })
        }else{

            const isValidPassword = await bcrypt.compare(password,uniqueUser.password);
            
            if(isValidPassword){
                const info = {
                    "id" : uniqueUser.id,
                    "firstName": uniqueUser.firstName,
                    "lastName": uniqueUser.lastName,
                    "email": uniqueUser.email,
                    "role": uniqueUser.role,
                    "telp": uniqueUser.telp,
                    "nama_toko" : uniqueUser.nama_toko,
                    "buka_toko": uniqueUser.buka_toko,
                    "klasifikasi_toko": uniqueUser.klasifikasi_toko,
                    "rating_toko": uniqueUser.rating_toko,   
                }

                // TOKEN
                const token = jwt.sign(info,secretKey);
                
                console.log(token);
                

                return res.status(200).send({
                    success: true,
                    message:"Login Success",
                    token:token,
                })
                // setTimeout(() => {
                //     res.status(200).json({
                //         success: true,
                //         message: "Login Success",
                //         token: token,
                //     });
                // }, 5000);

            }else{
                return res.status(200).json({
                    success: false,
                    message: "Salah Password",ß
                });
            }
        }
        
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "Terjadi Kesalahan",
            error : error,
        });
    }
});

app.post("/api/v1/pengajuan", async (req, res) => { 
    try {
        const { userId, nama_toko, telp, klasifikasi_toko, kode_pos, provinsi, kabupaten, kecamatan, desa, catatan, detail } = req.body;

        // Cek apakah user sudah mengajukan sebelumnya
        const existingRequest = await prisma.users.findFirst({
            where: { status_pengajuan: 1, id: parseInt(userId) },
            select: {
                id: true,
                status_pengajuan: true
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "User sudah mengajukan pembukaan toko sebelumnya"
            });
        }


        const createPengajuan = await prisma.users.update({
            data: {
                time_pengajuan: new Date(),
                time_terima: null,
                status_pengajuan: 0,
                acc_by: null,
                nama_toko: nama_toko,
                telp: telp, 
                klasifikasi_toko: parseInt(klasifikasi_toko),
                status_pengajuan: 1,
            },
            where: { id: parseInt(userId) }
        });


        return res.status(200).json({
            success: true,
            message: "Pengajuan pembukaan toko berhasil",
        });

    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.post("/api/v1/add_to_cart", async (req, res) => {   
    const { userId, productId, quantity } = req.body;
    try {
        // Cek apakah user sudah ada di cart
        const existingCart = await prisma.cart.findFirst({
            where: {
                userId: parseInt(userId),
                productId: parseInt(productId)
            }
        });

        if (existingCart) {
            // Jika sudah ada, update quantity
            const updatedCart = await prisma.cart.update({
                where: { id: existingCart.id },
                data: { 
                    quantity: existingCart.quantity + parseInt(quantity),
                    time : new Date(), 
                }
            });
            return res.status(200).json({
                success: true,
                message: "Cart updated successfully",
                data: updatedCart
            });
        } else {
            // Jika belum ada, buat entry baru di cart
            const newCart = await prisma.cart.create({
                data: {
                    userId: parseInt(userId),
                    productId: parseInt(productId),
                    quantity: parseInt(quantity),
                    time: new Date(),
                }
            });
            return res.status(201).json({
                success: true,
                message: "Product added to cart successfully",
                data: newCart
            });
        }
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }

});

app.post("/api/v1/register", async (req, res) => {
    try {
        const { firstName, lastName, password, email} = req.body;
        // console.log(req.body);

        if (!firstName || !lastName || !password || !email ) {
            return res.status(400).json({
                success: false,
                message: "Data tidak lengkap",
            });
        }

        // Cek email dulu
        const existingUser = await prisma.users.findUnique({
            where: { email }
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email sudah digunakan",
            });
        }
          

        const hashedPass = await bcrypt.hash(password, 10);

        const newUser = await prisma.users.create({
            data : {
                firstName : firstName,
                lastName : lastName,
                email : email,
                role : 1,
                password : hashedPass,
            }
        })

        return res.status(201).json({
            success: true,
            message: "User berhasil didaftarkan",
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.post('/api/v1/pengajuan/acc', authenticateAdmin, async (req, res) => {
    try {
        const { userId, acc } = req.body;

        // Cek apakah user ada
        const user = await prisma.users.findUnique({
            where: { 
                id: parseInt(userId),
                status_pengajuan: 1 // hanya ambil user yang sedang mengajukan
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
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
            }
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
            data: error
        });
    }
});


app.post('/api/v1/product', async (req, res) => {
    try {
        const { nama, harga, deskripsi, stock, userId } = req.body;

        // Validasi input
        if (!nama || !harga || !deskripsi || !stock || !userId) {
            return res.status(400).json({
                success: false,
                message: "Data tidak lengkap"
            });
        }

        // Cek apakah user ada
        const user = await prisma.users.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Buat produk baru
        const newProduct = await prisma.product.create({
            data: {
                nama,
                harga: parseFloat(harga),
                desc: deskripsi,
                stock: parseInt(stock),
                userId: parseInt(userId),
                path: "/path/test",
            }
        });

        return res.status(201).json({
            success: true,
            message: "Produk berhasil ditambahkan",
            data: newProduct
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});
  
// END

// DELETE API
app.delete('/api/v1/cart', async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Cek apakah cart ada
        const existingCart = await prisma.cart.findFirst({
            where: {
                userId: parseInt(userId),
                productId: parseInt(productId)
            }
        });

        if (!existingCart) {
            return res.status(404).json({
                success: false,
                message: "Cart tidak ditemukan"
            });
        }

        // Hapus cart
        await prisma.cart.delete({
            where: { id: existingCart.id }
        });

        return res.status(200).json({
            success: true,
            message: "Cart berhasil dihapus"
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.delete('/api/v1/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah produk ada
        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        // Hapus produk
        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({
            success: true,
            message: "Produk berhasil dihapus"
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.delete('api/v1/review/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah review ada
        const existingReview = await prisma.review.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingReview) {
            return res.status(404).json({
                success: false,
                message: "Review tidak ditemukan"
            });
        }

        // Hapus review
        await prisma.review.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({
            success: true,
            message: "Review berhasil dihapus"
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
}
);

// PATCH API    

app.patch('/api/v1/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, harga, deskripsi, stock } = req.body;

        // Cek apakah produk ada
        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        // Update produk
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                nama,
                harga: parseFloat(harga),
                desc: deskripsi,
                stock: parseInt(stock)
            }
        });

        return res.status(200).json({
            success: true,
            message: "Produk berhasil diupdate",
            data: updatedProduct
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
}
);

app.patch('/api/v1/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, telp, nama_toko, klasifikasi_toko } = req.body;

        // Cek apakah user ada
        const existingUser = await prisma.users.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
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
                klasifikasi_toko
            }
        });

        return res.status(200).json({
            success: true,
            message: "User berhasil diupdate",
            data: updatedUser
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});

app.patch('/api/v1/users/password/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Cek apakah user ada
        const existingUser = await prisma.users.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Hash password baru
        const hashedPass = await bcrypt.hash(password, 10);

        // Update password user
        const updatedUser = await prisma.users.update({
            where: { id: parseInt(id) },
            data: {
                password: hashedPass
            }
        });

        return res.status(200).json({
            success: true,
            message: "Password berhasil diupdate",
            data: updatedUser
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
            data: error
        });
    }
});


app.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
});