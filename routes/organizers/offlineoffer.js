var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const shopModel = require('../../models/shops.model');
const shopcategoryModel = require('../../models/shopcategories.model');
const mongoose = require('mongoose');
const offlineofferModel = require('../../models/offlineoffers.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid } = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)){
                
            }else{
                return responseManager.badrequest({ message: 'Invalid shop id to get offline offer list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to get offline offer list, please try again' }, res);
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
            const { shopid, offerid, offer_title, start_date, end_date, poster, video, description, offer_on_all_products, all_product_images, all_product_conditions, offer_type, offer_type_conditions, tandc } = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)){
                if(offer_on_all_products && offer_on_all_products == true){
                    if(all_product_images && all_product_images.length > 0 && all_product_conditions && all_product_conditions.length > 0){
                        if(offerid && offerid && mongoose.Types.ObjectId.isValid(offerid)){
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : all_product_images,
                                all_product_conditions : all_product_conditions,
                                offer_type : '',
                                offer_type_conditions : [],
                                tandc : tandc,
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findByIdAndUpdate(offerid, obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offerid).lean();
                            return responseManager.onSuccess('Offline offer updated successfully!', offlineOffer, res);
                        }else{
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : all_product_images,
                                all_product_conditions : all_product_conditions,
                                offer_type : '',
                                offer_type_conditions : [],
                                tandc : tandc,
                                shopid : mongoose.Types.ObjectId(shopid),
                                createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            let createdOfflineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).create(obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(createdOfflineOffer._id).lean();
                            return responseManager.onSuccess('Offline offer created successfully!', offlineOffer, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid product conditions to create offer, product images and product conditions can not be empty, please try again' }, res);
                    }
                }else{
                    if(offer_type && (offer_type == 'limited_person' || offer_type == 'unlimited_person') && offer_type_conditions && offer_type_conditions.length > 0){
                        if(offerid && offerid && mongoose.Types.ObjectId.isValid(offerid)){
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : [],
                                all_product_conditions : [],
                                offer_type : offer_type,
                                offer_type_conditions : offer_type_conditions,
                                tandc : tandc,
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findByIdAndUpdate(offerid, obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offerid).lean();
                            return responseManager.onSuccess('Offline offer updated successfully!', offlineOffer, res);
                        }else{
                            var obj = {
                                offer_title : offer_title,
                                start_date : start_date,
                                end_date : end_date,
                                poster : poster,
                                video : video,
                                description : description,
                                offer_on_all_products : offer_on_all_products,
                                all_product_images : [],
                                all_product_conditions : [],
                                offer_type : offer_type,
                                offer_type_conditions : offer_type_conditions,
                                tandc : tandc,
                                shopid : mongoose.Types.ObjectId(shopid),
                                createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                            };
                            let createdOfflineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).create(obj);
                            let offlineOffer = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(createdOfflineOffer._id).lean();
                            return responseManager.onSuccess('Offline offer created successfully!', offlineOffer, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid product conditions to create offer, offer type must be limited or unlimited person only and offer conditions can not be empty, please try again' }, res);
                    }
                }   
            }else{
                return responseManager.badrequest({ message: 'Invalid shop id to get offline offer list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to get offline offer list, please try again' }, res);
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
            const { shopid, offlineofferid } = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid) && offlineofferid && offlineofferid != '' && mongoose.Types.ObjectId.isValid(offlineofferid)){
                let offlineOfferData = await primary.model(constants.MODELS.offlineoffers, offlineofferModel).findById(offlineofferid).lean();
                if(offlineOfferData && offlineOfferData.shopid.toString() == shopid.toString()){
                    return responseManager.onSuccess('Offline offer data!', offlineOfferData, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid shop id to get Shop data, please try again' }, res);
                }
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
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (req.file) {
                if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 512) {
                        if(filesizeinMb > 25){
                            AwsCloud.saveToS3Multipart(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'offlineoffer').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }else{
                            AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'offlineoffer').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Video file must be <= 512 MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only video files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to upload video, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload video, please try again' }, res);
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
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'offlineoffer').then((result) => {
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
            return responseManager.badrequest({ message: 'Invalid organizerid to upload banner, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload banner, please try again' }, res);
    }
});
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 3) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'offlineoffer').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= 3 MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to upload image, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
module.exports = router;