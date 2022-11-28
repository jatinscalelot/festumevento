var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const onlineofferModel = require('../../models/onlineoffers.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.onlineoffers, onlineofferModel).paginate({
                $or: [
                    { offer_title: { '$regex': new RegExp(search, "i") } },
                    { description: { '$regex': new RegExp(search, "i") } }
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                lean: true
            }).then((onlineoffers) => {
                return responseManager.onSuccess('Online Offers list!', onlineoffers, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to get online offer list, please try again' }, res);
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
            const { offerid, shop_name, offer_amount, offer_type, start_date, end_date, product_name, poster, images, description, status, product_links, company_name, company_gst, company_contact_no, company_email, about_company, tandc } = req.body;
            if (offerid && offerid && mongoose.Types.ObjectId.isValid(offerid)) {
                var obj = {
                    shop_name: shop_name,
                    offer_amount: offer_amount,
                    offer_type: offer_type,
                    start_date: start_date,
                    end_date: end_date,
                    product_name: product_name,
                    poster: poster,
                    images: images,
                    description: description,
                    status: status,
                    product_links: product_links,
                    company_name: company_name,
                    company_gst: company_gst,
                    company_contact_no : company_contact_no,
                    company_email : company_email,
                    about_company : about_company,
                    tandc: tandc,
                    updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                };
                await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findByIdAndUpdate(offerid, obj);
                let onlineOffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(offerid).lean();
                return responseManager.onSuccess('Online offer updated successfully!', onlineOffer, res);
            } else {
                var obj = {
                    shop_name: shop_name,
                    offer_amount: offer_amount,
                    offer_type: offer_type,
                    start_date: start_date,
                    end_date: end_date,
                    product_name: product_name,
                    poster: poster,
                    images: images,
                    description: description,
                    status: status,
                    product_links: product_links,
                    company_name: company_name,
                    company_gst: company_gst,
                    company_contact_no : company_contact_no,
                    company_email : company_email,
                    about_company : about_company,
                    tandc: tandc,
                    createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                    updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                };
                let createdOnlineOffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).create(obj);
                let onlineOffer = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(createdOnlineOffer._id).lean();
                return responseManager.onSuccess('Online offer created successfully!', onlineOffer, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to save online offer data, please try again' }, res);
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
            const { onlineofferid } = req.body;
            if (onlineofferid && onlineofferid != '' && mongoose.Types.ObjectId.isValid(onlineofferid)) {
                let onlineOfferData = await primary.model(constants.MODELS.onlineoffers, onlineofferModel).findById(onlineofferid).lean();
                if (onlineOfferData && onlineOfferData.createdBy.toString() == req.token.organizerid.toString()) {
                    return responseManager.onSuccess('Online offer data!', onlineOfferData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid offer id to get online offer data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get online offer data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            if (req.file) {
                if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 512) {
                        if (filesizeinMb > 25) {
                            AwsCloud.saveToS3Multipart(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'onlineoffer').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        } else {
                            AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'onlineoffer').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Video file must be <= 512 MB, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid file type only video files allowed, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to upload video, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to upload video, please try again' }, res);
    }
});
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 10) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'onlineoffer').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    } else {
                        return responseManager.badrequest({ message: 'Banner file must be <= 10 MB, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to upload banner, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to upload banner, please try again' }, res);
    }
});
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 3) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'onlineoffer').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    } else {
                        return responseManager.badrequest({ message: 'Image file must be <= 3 MB, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to upload image, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
module.exports = router;