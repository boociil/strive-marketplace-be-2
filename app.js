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

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/users', async (req, res) => {
    const { name, email, password } = req.body;
  
    const hashedPass = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password:hashedPass }, 
    });
  
    res.json(user);
});

app.get('/users', async (req, res) => {
    const users = await prisma.users.findMany();
    res.json(users);
});

app.post("/api/v1/login", async (req,res) => {

    try {

        

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Terjadi Kesalahan",
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
  
  
app.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
});