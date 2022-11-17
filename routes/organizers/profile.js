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
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        return responseManager.onSuccess('Organizer profile!', organizerData, res);
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organizer profile, please try again' }, res);
    }
});
router.post('/', helper.authenticateToken, async (req, res, next) => {
    const { name, dob, city, pincode, state, country, about } = req.body;
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
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
        return responseManager.onSuccess('Organizer profile updated successfully!', 1, res);
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update organizer profile, please try again' }, res);
    }
});
router.post('/profilepic', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res, next) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                if (filesizeinMb <= 5) {
                    AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'organizerprofile').then((result) => {
                        let obj = {profile_pic : result.data.Key};
                        primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, obj).then((updateResult) => {
                            return responseManager.onSuccess('Organizer profile pic updated successfully!', 1, res);
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
        return responseManager.badrequest({ message: 'Invalid token to update organizer profile, please try again' }, res);
    }
});
module.exports = router;
