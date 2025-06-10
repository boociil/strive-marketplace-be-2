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

app.get('/api/v1/users', async (req, res) => {
    const users = await prisma.users.findMany();
    res.json(users);
});

app.get('/api/v1/product', async (req,res) => {

    try {
        const {total, page, orderBy} = req.body;
        // console.log(req.params);
        

        console.log(total, page, orderBy);
        

        let order = {};

        if (orderBy == "harga_desc"){
            order = {harga : 'desc'}
        }else if (orderBy == "harga_asc"){
            order = {harga : "asc"}
        }

        let totalQ = parseInt(total) || 10;
        let pageQ = parseInt(page) || 1;


        const result = await prisma.product.findMany({
            include: {
                user: {
                select: {  // Ini diperbolehkan dalam include
                    nama_toko: true,
                    rating_toko: true
                }
                }
            },
            take: totalQ,
            skip: (pageQ - 1) * totalQ,
            orderBy: order,
            where: {
                stock: { gt: 0 }
            }
        });

        console.log(result);
        
        return res.status(200).send({
            succes : true,
            message: "Req berhasil",
            data : result
        })
            
    } catch (error) {
        console.log(error);
        
        return res.status(400).send({
            success : false,
            message : "terjadi kesalahan"
        })
    }

});

// POST API

app.post('/api/v1/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    const hashedPass = await bcrypt.hash(password, 10);
    
    const user = await prisma.users.create({
        data: { name, email, password:hashedPass }, 
    });
    
    res.json(user);
});


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