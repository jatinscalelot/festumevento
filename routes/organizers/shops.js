var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
const listShopCtrl = require('../../controllers/organizer/shops/list');
const saveShopCtrl = require('../../controllers/organizer/shops/save');
const getOneShopCtrl = require('../../controllers/organizer/shops/getone');
const deleteShopCtrl = require('../../controllers/organizer/shops/remove');
router.post('/', helper.authenticateToken, listShopCtrl.list);
router.post('/save', helper.authenticateToken, saveShopCtrl.save);
router.post('/getone', helper.authenticateToken, getOneShopCtrl.getone);
router.post('/remove', helper.authenticateToken, deleteShopCtrl.remove);
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
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
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
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