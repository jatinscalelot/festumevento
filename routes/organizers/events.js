var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const responseManager = require('../../utilities/response.manager');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const mongoose = require('mongoose');
const createCtrl = require('../../controllers/organizer/events/create');
const aboutCtrl = require('../../controllers/organizer/events/about');
const arrangementCtrl = require('../../controllers/organizer/events/arrangement');
const locationCtrl = require('../../controllers/organizer/events/location');
const mediaCtrl = require('../../controllers/organizer/events/media');
const permissionCtrl = require('../../controllers/organizer/events/permission');
const companydetailCtrl = require('../../controllers/organizer/events/companydetail');
const personaldetailCtrl = require('../../controllers/organizer/events/personaldetail');
const tandcCtrl = require('../../controllers/organizer/events/tandc');
const discountCtrl = require('../../controllers/organizer/events/discount');
const eventRemoveCtrl = require('../../controllers/organizer/events/remove');
const eventListCtrl = require('../../controllers/organizer/events/list');
const getoneCtrl = require('../../controllers/organizer/events/getone');
const liveCtrl = require('../../controllers/organizer/events/live');
// post apis
router.post('/save', helper.authenticateToken, createCtrl.createevent);
router.post('/about', helper.authenticateToken, aboutCtrl.aboutevent);
router.post('/arrangement', helper.authenticateToken, arrangementCtrl.arrangement);
router.post('/location', helper.authenticateToken, locationCtrl.location);
router.post('/media', helper.authenticateToken, mediaCtrl.media);
router.post('/permission', helper.authenticateToken, permissionCtrl.permission);
router.post('/companydetail', helper.authenticateToken, companydetailCtrl.companydetail);
router.post('/personaldetail', helper.authenticateToken, personaldetailCtrl.personaldetail);
router.post('/tandc', helper.authenticateToken, tandcCtrl.tandc);
router.post('/discount', helper.authenticateToken, discountCtrl.discount);
router.post('/remove', helper.authenticateToken, eventRemoveCtrl.removeevent);
router.post('/list', helper.authenticateToken, eventListCtrl.list);
router.post('/liveone', helper.authenticateToken, liveCtrl.makeonelive);
router.post('/livemulti', helper.authenticateToken, liveCtrl.makemultilive);
// get apis
router.get('/', helper.authenticateToken, createCtrl.getevent);
router.get('/about', helper.authenticateToken, aboutCtrl.getaboutevent);
router.get('/arrangement', helper.authenticateToken, arrangementCtrl.getarrangement);
router.get('/location', helper.authenticateToken, locationCtrl.getlocation);
router.get('/media', helper.authenticateToken, mediaCtrl.getmedia);
router.get('/permission', helper.authenticateToken, permissionCtrl.getpermission);
router.get('/companydetail', helper.authenticateToken, companydetailCtrl.getcompanydetail);
router.get('/personaldetail', helper.authenticateToken, personaldetailCtrl.getpersonaldetail);
router.get('/tandc', helper.authenticateToken, tandcCtrl.gettandc);
router.get('/discount', helper.authenticateToken, discountCtrl.getdiscount);
router.get('/getone', helper.authenticateToken, getoneCtrl.getone);
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    console.log('event image size', filesizeinMb);
                    if (filesizeinMb <= 10) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= 10 MB, please try again' }, res);
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
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 512) {
                        if(filesizeinMb > 25){
                            AwsCloud.saveToS3Multipart(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }else{
                            AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
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
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    console.log('event banner filesizeinMb', filesizeinMb);
                    if (filesizeinMb <= 25) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Banner file must be <= 25 MB, please try again' }, res);
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
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/document', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.docarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 25) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
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