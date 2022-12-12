var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
const listOnlineOfferCtrl = require('../../controllers/organizer/offers/online/list');
const saveOnlineOfferCtrl = require('../../controllers/organizer/offers/online/save');
const getOneOnlineOfferCtrl = require('../../controllers/organizer/offers/online/getone');
const removeOnlineOfferCtrl = require('../../controllers/organizer/offers/online/remove');
router.post('/', helper.authenticateToken, listOnlineOfferCtrl.list);
router.post('/save', helper.authenticateToken, saveOnlineOfferCtrl.save);
router.post('/getone', helper.authenticateToken, getOneOnlineOfferCtrl.getone);
router.post('/remove', helper.authenticateToken, removeOnlineOfferCtrl.remove);
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