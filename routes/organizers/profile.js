let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            organizerData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Organizer profile!', organizerData, res);
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get organizer profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organizer profile, please try again' }, res);
    }
});
router.post('/', helper.authenticateToken, async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, dob, city, pincode, state, country, about } = req.body;
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            let obj = {
                name : name,
                dob : dob,
                city : city,
                pincode : pincode,
                state : state,
                country : country,
                about : about,
                updatedBy : mongoose.Types.ObjectId(req.token.organizerid)
            };
            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, obj);
            let updatedorganizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
            organizerData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Organizer profile updated successfully!', updatedorganizerData, res);
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to set organizer profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update organizer profile, please try again' }, res);
    }
});
router.post('/profilepic', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 5) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'organizerprofile').then((result) => {
                            let obj = {profile_pic : result.data.Key};
                            primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, obj).then((updateResult) => {
                                ( async () => {
                                    let updatedorganizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
                                    updatedorganizerData.s3Url = process.env.AWS_BUCKET_URI;
                                    return responseManager.onSuccess('Organizer profile pic updated successfully!', updatedorganizerData, res);
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= 5 MB for profile pic, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed for profile pic, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to update organizer profile pic, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to set organizer profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update organizer profile, please try again' }, res);
    }
});
router.post('/businessprofile', helper.authenticateToken, async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, mobile, country_code, street, area, city, state, pincode, dob, country, about } = req.body;
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            let obj = {
                profile_pic : (organizerData.businessProfile && organizerData.businessProfile.profile_pic &&  organizerData.businessProfile.profile_pic != '') ? organizerData.businessProfile.profile_pic : '',
                name : name,
                email : email,
                mobile : mobile,
                country_code : country_code,
                street : street,
                area : area,
                city : city,
                state : state,
                pincode : pincode,
                dob : dob,
                country : country,
                about : about
            };
            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, {businessProfile : obj});
            let updatedorganizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
            updatedorganizerData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Organizer business profile updated successfully!', updatedorganizerData, res);
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to set organizer business profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update organizer business profile, please try again' }, res);
    }
});
router.post('/businessprofilepic', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 5) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'organizerbusinessprofile').then((result) => {
                            primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, {"businessProfile.profile_pic" : result.data.Key}).then((updateResult) => {
                                ( async () => {
                                    let updatedorganizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
                                    updatedorganizerData.s3Url = process.env.AWS_BUCKET_URI;
                                    return responseManager.onSuccess('Organizer business profile pic updated successfully!', updatedorganizerData, res);
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= 5 MB for business profile pic, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed for business profile pic, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to update organizer business profile pic, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to set organizer business profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update organizer business profile, please try again' }, res);
    }
});
module.exports = router;
