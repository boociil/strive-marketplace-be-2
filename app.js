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

// agar API bisa diakses
const cors = require('cors');
const path = require('path');

const secretKey = "hkalshd9832yhui234hg234gjksdfsdnbnsvoisdsii";

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// GET API

app.get('/', (req, res) => {
    res.send('API Connected');
});

app.get('/api/v1/users', async (req, res) => {
    const users = await prisma.users.findMany();
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
                stock: { gt: 0 },
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
            include: {
                user: {
                    select: {
                        nama_toko: true,
                        rating_toko: true
                    }
                }
            },
            take: totalQ,
            skip: skip,
            orderBy: order,
            where: {
                stock: { gt: 0 },
                nama: keywordTrimmed ? {
                    contains: keywordTrimmed,
                    mode: 'insensitive'
                } : undefined
            }
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

app.get('/api/v1/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    select: {
                        nama_toko: true,
                        rating_toko: true
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

// POST API

app.post('/api/v1/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    const hashedPass = await bcrypt.hash(password, 10);
    
    const user = await prisma.users.create({
        data: { name, email, password:hashedPass }, 
    });
    
    res.json(user);
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

app.post("/api/v1/login", async (req,res) => {
    
    try {     

        const {email, password} = req.body;
        
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
                alamat_toko: true,
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
                    "alamat_toko": uniqueUser.alamat_toko,
                    "rating_toko": uniqueUser.rating_toko,
                    
                }

                // TOKEN
                const token = jwt.sign(info,secretKey);
                

                return res.status(200).send({
                    message:"Login Success",
                    token:token,
                })
            }else{
                return res.status(400).json({
                    success: false,
                    message: "Salah Password",ß
                });
            }
        }
        
    } catch (error) {
        return res.status(500).json({
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
        const existingRequest = await prisma.pengajuan.findFirst({
            where: { userId: parseInt(userId) },
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "User sudah mengajukan pembukaan toko sebelumnya"
            });
        }


        const createPengajuan = await prisma.pengajuan.create({
            data: {
                userId: parseInt(userId),
                time: new Date(),
                status: 0, // 0 = pending,
                accBy: null,
            }
        });

        const cekAlamat = await prisma.alamat.findFirst({
            where: { 
                userId: parseInt(userId),
                provinsi: provinsi,
                kabupaten: kabupaten,
                kecamatan: kecamatan,
                desa: desa,
                kode_pos: kode_pos, 
            }
        });

        if(!cekAlamat){
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
        }

        const updateUser = await prisma.users.update({
            where: { id: parseInt(userId) },
            data: {
                nama_toko: nama_toko,
                klasifikasi_toko: klasifikasi_toko,
                telp : telp,
                buka_toko: 0, // 0 = belum buka toko
            }
        });

        return res.status(200).json({
            success: true,
            message: "Pengajuan pembukaan toko berhasil",
            data: createPengajuan
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
  
// END

app.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
});