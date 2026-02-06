const { Router } = require("express")
const { generateToken } = require("../services/authentication")
const bcrypt = require('bcrypt')
const User = require('../models/user')
const multer = require("multer")
const path = require("path");
const fs = require("fs");
const { checkforrole } = require("../middlewares/auth")
const router = Router()

//login and signup request handler
router.get("/signin", (req, res) => {
    res.render("signin")
})

router.get("/signup", (req, res) => {
    res.render("signup")
})

router.post("/signup", async (req, res) => {
    const { fullName, email, password, state, district, region, farmArea, pincode } = req.body

    // Validate required fields
    if (!fullName || !email || !password || !pincode || !farmArea) {
        return res.render("signup", {
            error: "All fields are required"
        })
    }

    // Password strength validation
    if (password.length < 6) { // FIXED: Changed from 4 to 6 to match error message
        return res.render("signup", {
            error: "Password must be at least 6 characters long"
        })
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.render("signup", {
                error: "Email already registered. Please sign in."
            })
        }



        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);



        // Create user and save to variable
        const user = await User.create({ // FIXED: Added 'const user ='
            fullName,
            email,
            password: hashedPassword,
            pincode,
            state,
            district,
            region,
            farmArea,
        })


        const token = generateToken(user);

        // SET COOKIE WITH OPTIONS
        return res.cookie("token", token).redirect("/user/dashboard?success=Account created successfully.");


    } catch (error) {
        console.error("Signup error:", error)
        return res.render("signup", {
            error: "Error creating account. Please try again."
        })
    }
})

router.post("/signin", async (req, res) => {

    const { email, password } = req.body
    if (!email || !password) {
        return res.render("signin", {
            error: "All fields are required"
        })
    }

    try {
        const user = await User.findOne({ email })

        if (!user) {
            console.log("User not found");
            return res.render("signin", {
                error: "Invalid email or password"
            })
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            console.log("Password incorrect");
            return res.render("signin", {
                error: "Invalid email or password"
            })
        }

        const token = generateToken(user);

        // SET COOKIE WITH OPTIONS
        return res.cookie("token", token).redirect("/user/dashboard?success=You logged in successfully.");

    } catch (error) {
        console.error("Login error:", error)
        return res.render("signin", {
            error: "Error logging in. Please try again."
        })
    }
})

// Route for updating farm details
router.post("/update-profile", checkforrole("USER"), async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            pincode,
            state,
            district,
            region,
            farmArea,
        } = req.body;

        const updateData = {
            pincode,
            state,
            district,
            region,
            farmArea,
        };

        await User.findByIdAndUpdate(userId, updateData);
        const updatedUser = await User.findById(userId);

        const newToken = generateToken(updatedUser);

        return res.cookie("token", newToken).redirect("/user/profile?farmSuccess=Your profile updated successfully.");
    } catch (err) {
        console.error(err);
        // Instead of res.status(500).send("Something went wrong")
        return res.redirect("/user/profile?error=Something went wrong. Please try again.");
    }
});

// Route for updating password
router.post("/update-password", checkforrole("USER"), async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Check if all fields are provided
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.redirect("/user/profile?passwordError=All fields are required.");
        }
        // After checking if passwords match
        if (newPassword.length < 6) {
            return res.redirect("/user/profile?passwordError=New password must be at least 6 characters long.");
        }

        // Verify current password
        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.redirect("/user/profile?passwordError=Current password is incorrect.");
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.redirect("/user/profile?passwordError=New password do not match.");
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        return res.redirect("/user/profile?passwordSuccess=Your password updated successfully.");
    } catch (err) {
        console.error(err);
        // Instead of res.status(500).send("Something went wrong")
        return res.redirect("/user/profile?error=Something went wrong. Please try again.");
    }
});


router.get("/logout", async (req, res) => {
    return res.clearCookie("token").redirect("/?success=You logged out successfully.");
})


router.get("/dashboard", checkforrole("USER"), (req, res) => {
    return res.render("dashboard", {
        user: req.user,
    })
})



router.get("/profile", checkforrole("USER"), (req, res) => {
    return res.render("profile", {
        user: req.user
    })
})
router.get("/crop-info", checkforrole("USER"), (req, res) => {
    return res.render("cropinfo", {
        user: req.user
    })
})
router.get("/market", checkforrole("USER"), (req, res) => {
    return res.render("market", {
        user: req.user
    })
})
router.get("/AI-disease-diagnose", checkforrole("USER"), (req, res) => {
    return res.render("diseasediagnose", {
        user: req.user
    })
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve("./public/uploads"))
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`
        cb(null, filename)
    }
})

const upload = multer({ storage: storage })

router.post("/aidisease", upload.single("cropimageurl"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please upload the crop image."
            });
        }

        // ✅ Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            // Delete invalid file immediately
            fs.unlinkSync(path.join(__dirname, "../public/uploads", req.file.filename));
            return res.status(400).json({
                success: false,
                error: "Invalid file type. Only JPEG, PNG, and WebP are allowed."
            });
        }

        // ✅ FIXED: Force HTTPS on production (prevents Mixed Content error)
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const cropimageurl = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        // 🧹 Schedule cleanup (increase to 10-15 min for AI processing)
        const filePath = path.join(__dirname, "../public/uploads", req.file.filename);
        
        const cleanupTimeout = setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') { // Ignore if already deleted
                    console.error("❌ Image delete failed:", err.message);
                } else {
                    console.log("✅ Image deleted:", req.file.filename);
                }
            });
        }, 15 * 60 * 1000); // FIXED: Changed to 15 minutes (was 5)

        // Store timeout ID if you need to cancel it later
        cleanupTimeout.unref(); // Allow process to exit even if timeout is pending

        // ✅ Redirect to diagnosis page
        return res.redirect(`/user/AI-disease-diagnose?cropimageurl=${encodeURIComponent(cropimageurl)}`);

    } catch (error) {
        console.error("❌ Upload error:", error);
        
        // Cleanup file if it was uploaded but processing failed
        if (req.file) {
            try {
                fs.unlinkSync(path.join(__dirname, "../public/uploads", req.file.filename));
            } catch (unlinkError) {
                console.error("❌ Cleanup failed:", unlinkError.message);
            }
        }
        
        return res.status(500).json({
            success: false,
            error: "Image upload failed"
        });
    }
});



//exporting the router
module.exports = router