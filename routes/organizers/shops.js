var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const shopModel = require('../../models/shops.model');
const shopcategoryModel = require('../../models/shopcategories.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
function validateLatLng(lat, lng) {
    let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
    return pattern.test(lat) && pattern.test(lng);
};
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.shops, shopModel).paginate({
                $or: [
                    { shop_name : { '$regex' : new RegExp(search, "i") } },
                    { about_shop : { '$regex' : new RegExp(search, "i") } },
                    { flat_no : { '$regex' : new RegExp(search, "i") } },
                    { street_name : { '$regex' : new RegExp(search, "i") } },
                    { area_name : { '$regex' : new RegExp(search, "i") } },
                    { city : { '$regex' : new RegExp(search, "i") } },
                    { state : { '$regex' : new RegExp(search, "i") } },
                    { pincode : { '$regex' : new RegExp(search, "i") } }
                ],
                createdBy : mongoose.Types.ObjectId(req.token.organizerid)
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                populate:  { path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description"},
                lean: true
            }).then((shops) => {
                return responseManager.onSuccess('Shops list!', shops, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get Shop list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid, banner, shop_name, shop_category, shop_days, start_date, end_date, about_shop, flat_no, street_name, area_name, city, state, pincode, longitude, latitude } = req.body;
            if (banner && shop_name && shop_category && shop_days && start_date && end_date && about_shop && flat_no && street_name && area_name && city && state && pincode && longitude && latitude) {
                if (shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)) {
                    if (latitude && latitude != '' && longitude && longitude != '' && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
                        let obj = {
                            banner: banner,
                            shop_name: shop_name,
                            shop_category: mongoose.Types.ObjectId(shop_category),
                            shop_days: shop_days,
                            start_date: start_date,
                            end_date: end_date,
                            about_shop: about_shop,
                            flat_no: flat_no,
                            street_name: street_name,
                            area_name: area_name,
                            city: city,
                            state: state,
                            pincode: pincode,
                            location : { type: "Point", coordinates: [longitude, latitude] },
                            updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                        };
                        await primary.model(constants.MODELS.shops, shopModel).findByIdAndUpdate(shopid, obj);
                        let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).populate({path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description"}).lean();
                        if(shopData && shopData != null){
                            return responseManager.onSuccess('Shop updated successfully!', shopData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid shop id to update Shop, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid Lat-Long to update Shop, please try again' }, res);
                    }
                } else {
                    if (latitude && latitude != '' && longitude && longitude != '' && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
                        let obj = {
                            banner: banner,
                            shop_name: shop_name,
                            shop_category: mongoose.Types.ObjectId(shop_category),
                            shop_days: shop_days,
                            start_date: start_date,
                            end_date: end_date,
                            about_shop: about_shop,
                            flat_no: flat_no,
                            street_name: street_name,
                            area_name: area_name,
                            city: city,
                            state: state,
                            pincode: pincode,
                            location : { type: "Point", coordinates: [longitude, latitude] },
                            createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                            updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                        };
                        let createdShop = await primary.model(constants.MODELS.shops, shopModel).create(obj);
                        let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(createdShop._id).populate({path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description"}).lean();
                        if(shopData && shopData != null){
                            return responseManager.onSuccess('Shop created successfully!', shopData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid shop data to create Shop, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid Lat-Long to create Shop, please try again' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'All fields are mandatory to update or create Shop, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get Shop list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/companydetails', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid, company_name, gst_file, contact_number, emailid, about, social_media_links} = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)){
                let obj = {
                    company_name : company_name,
                    gst_file : gst_file,
                    contact_number : contact_number,
                    emailid : emailid,
                    about : about,
                    social_media_links : social_media_links
                };
                await primary.model(constants.MODELS.shops, shopModel).findByIdAndUpdate(shopid, {companydetails : obj});
                let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).populate({path: 'shop_category', model: primary.model(constants.MODELS.shopcategories, shopcategoryModel), select: "categoryname description"}).lean();
                if(shopData && shopData != null){
                    return responseManager.onSuccess('Shop updated successfully!', shopData, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid shop id to update Shop, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid shopid to update Shop data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update Shop data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid } = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)){
                let shopData = await primary.model(constants.MODELS.shops, shopModel).findById(shopid).lean();
                return responseManager.onSuccess('Shop data!', shopData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid shop id to get Shop data, please try again' }, res);
            }
        }else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get Shop data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 10) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'shop').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Banner file must be <= 10 MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to upload shop banner, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload shop banner, please try again' }, res);
    }
});
router.post('/document', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (req.file) {
                if (allowedContentTypes.docarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 25) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'shop').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Document file must be <= 25 MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only document (PDF) files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to upload document, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload document, please try again' }, res);
    }
});
module.exports = router;