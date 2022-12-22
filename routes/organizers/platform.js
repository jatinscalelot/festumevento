let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const platformModel = require('../../models/platforms.model');
const organizerModel = require('../../models/organizers.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
router.get('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            primary.model(constants.MODELS.platforms, platformModel).find({ status: true, $or : [{createdBy : mongoose.Types.ObjectId(req.token.organizerid)}, {owner:'superadmin'}] }).lean().then((platforms) => {
                return responseManager.onSuccess('Platforms list!', platforms, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get platforms list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { platformid } = req.body;
            if (platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)) {
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                primary.model(constants.MODELS.platforms, platformModel).findById(platformid).lean().then((platform) => {
                    return responseManager.onSuccess('Platform data!', platform, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.unauthorisedRequest(res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get platform, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { platformid, name, platformimage, description, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                let existingplatform = await primary.model(constants.MODELS.platforms, platformModel).findOne({_id : {$ne : platformid}, name : name, $or: [{ owner : 'superadmin' },{ createdBy : mongoose.Types.ObjectId(req.token.organizerid) }]}).lean();
                if(existingplatform == null){
                    let obj = {
                        name : name,
                        platformimage : platformimage,
                        description : description,
                        status : status,
                        updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    await primary.model(constants.MODELS.platforms, platformModel).findByIdAndUpdate(platformid, obj);
                    let platformData = await primary.model(constants.MODELS.platforms, platformModel).findById(platformid).lean();
                    return responseManager.onSuccess('Platform updated sucecssfully!', platformData, res);
                }else{
                    return responseManager.badrequest({ message: 'Platform name can not be identical, please try again' }, res);
                }
            }else{
                let existingplatform = await primary.model(constants.MODELS.platforms, platformModel).findOne({name : name, $or: [{ owner : 'superadmin' },{ createdBy : mongoose.Types.ObjectId(req.token.organizerid) }]}).lean();
                if(existingplatform == null) {
                    let obj = {
                        name : name,
                        platformimage : platformimage,
                        description : description,
                        status : status,
                        owner: 'organizer',
                        createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let lastAdded = await primary.model(constants.MODELS.platforms, platformModel).create(obj);
                    let platformData = await primary.model(constants.MODELS.platforms, platformModel).findById(lastAdded._id).lean();
                    return responseManager.onSuccess('Platform created sucecssfully!', platformData, res);
                }else{
                    return responseManager.badrequest({ message: 'Platform name can not be identical, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to save platform data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token save platform data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { platformid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if(platformid && platformid != '' && mongoose.Types.ObjectId.isValid(platformid)){
                let platformData = primary.model(constants.MODELS.platforms, platformModel).findById(platformid);
                if(platformData && platformData.createdB && platformData.createdBy.toString() == req.token.organizerid.toString()){
                    await primary.model(constants.MODELS.platforms, platformModel).findByIdAndRemove(platformid);
                    return responseManager.onSuccess('Platform removed sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid platform id to remove platform data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid platform id to remove platform data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove platform data, please try again' }, res);
    }
});
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 3) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'platform').then((result) => {
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