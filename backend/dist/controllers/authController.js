"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.getCurrentUser = exports.login = void 0;
const userModel_1 = require("../models/userModel");
// Simple JWT-like token (in production, use jsonwebtoken)
const generateToken = (userId) => {
    return Buffer.from(JSON.stringify({ userId, doctorId: userId, timestamp: Date.now() })).toString("base64");
};
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await userModel_1.User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = generateToken(user._id.toString());
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone,
            specialization: user.specialization,
            avatar: user.avatar,
            role: user.role,
        };
        const response = {
            token,
            user: userResponse,
            // Include doctor field for backward compatibility if it's a doctor
            ...(user.role === "doctor" ? {
                doctor: {
                    id: userResponse.id,
                    email: userResponse.email,
                    name: userResponse.name,
                    phone: userResponse.phone,
                    specialization: userResponse.specialization,
                    avatar: userResponse.avatar,
                }
            } : {}),
        };
        res.json(response);
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await userModel_1.User.findById(req.user.userId)
            .select("_id email name phone specialization avatar role hospitalId")
            .lean()
            .exec();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone,
            specialization: user.specialization,
            avatar: user.avatar,
            role: user.role,
            hospitalId: user.hospitalId?.toString(),
        };
        res.json({
            user: userResponse,
            ...(user.role === "doctor" ? {
                doctor: {
                    id: userResponse.id,
                    email: userResponse.email,
                    name: userResponse.name,
                    phone: userResponse.phone,
                    specialization: userResponse.specialization,
                    avatar: userResponse.avatar,
                }
            } : {}),
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getCurrentUser = getCurrentUser;
const register = async (req, res, next) => {
    try {
        const { email, password, name, phone, specialization, role } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Email, password, and name are required" });
        }
        const existingUser = await userModel_1.User.findOne({ email: email.toLowerCase() }).lean().exec();
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }
        // Create user with role (default to "doctor" if not specified)
        const userRole = (role || "doctor");
        const user = await userModel_1.User.create({
            email: email.toLowerCase(),
            password,
            name,
            phone,
            specialization,
            role: userRole,
        });
        const token = generateToken(user._id.toString());
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone,
            specialization: user.specialization,
            avatar: user.avatar,
            role: user.role,
        };
        const response = {
            token,
            user: userResponse,
            // Include doctor field for backward compatibility if it's a doctor
            ...(user.role === "doctor" ? {
                doctor: {
                    id: userResponse.id,
                    email: userResponse.email,
                    name: userResponse.name,
                    phone: userResponse.phone,
                    specialization: userResponse.specialization,
                    avatar: userResponse.avatar,
                }
            } : {}),
        };
        res.status(201).json(response);
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
