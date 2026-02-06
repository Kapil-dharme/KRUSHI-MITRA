const mongoose = require("mongoose")
let connecturl =process.env.MONGO_URI
async function connecttoserver() {
    return await mongoose.connect(connecturl).then(() => console.log("mongodb connected")).catch((err) => console.log(err))
}
module.exports = { connecttoserver };