function queryhandler(){
    return (req,res,next)=>{
        res.locals.success=req.query.success || null
        res.locals.error=req.query.error || null
        res.locals.farmError=req.query.farmError || null
        res.locals.farmSuccess=req.query.farmSuccess || null
        res.locals.passwordError=req.query.passwordError || null
        res.locals.passwordSuccess=req.query.passwordSuccess || null
        res.locals.cropimageurl=req.query.cropimageurl || null
        next()
    }
}

module.exports={
    queryhandler
}