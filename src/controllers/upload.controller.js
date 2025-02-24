import { base64Upload } from "../services/upload.service.js";

export const fileUpload = async(req,res,next)=>{
    try {
     const {message,url} =await base64Upload(req);   
     return res.status(200).json({
        success:true,
        message,
        url
     });
    } catch (error) {
     next(error)   
    }
}