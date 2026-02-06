const JWT = require("jsonwebtoken");

// Token generation
function generateToken(user) {
    const payload = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        farmArea: user.farmArea,
        pincode:user.pincode,
        state: user.state,
        district: user.district,
        region: user.region,
        createdAt:user.updatedAt,
        role: "USER" 
    }
    
  const token=JWT.sign(payload, process.env.SECRET); 
  return token
}

// Token verification
function verifyToken(token) {
    try {
        const payload = JWT.verify(token, process.env.SECRET);
        return payload;
    } catch (error) {
        console.error("Token verification error:", error.message);
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
}