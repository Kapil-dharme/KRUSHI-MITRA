const { verifyToken } = require("../services/authentication") 

function checkforauthentication(tokenname) {
    return (req, res, next) => {
        const tokenvalue = req.cookies[tokenname]
        if (!tokenvalue) {
            req.user = null
            return next()
        }

        try {
            const userpayload = verifyToken(tokenvalue) 
            req.user = userpayload
        } catch (error) {
            req.user = null
            res.clearCookie(tokenname)
        }
        return next()
    }
}

function checkforrole(...allowedroles) {
    return (req, res, next) => {
        if (!req.user) return res.redirect("/user/signin?error=Please sign in first")

        if (!allowedroles.includes(req.user.role)) {
             return res.redirect("/user/signin?error=Insufficient Permissions.")
        }
        next();
    };
}

module.exports = { checkforauthentication, checkforrole } 