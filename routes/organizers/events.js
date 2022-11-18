var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const responseManager = require('../../utilities/response.manager');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
function validateLatLng(lat, lng) {
    let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
    return pattern.test(lat) && pattern.test(lng);
};
router.post('/create', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { name, event_type, event_category, other } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if(name && name.trim() != '' && event_type && event_type.trim() != '' && ((event_category && event_category.trim() != '') || (other && other.trim() != ''))){
            let obj = {
                name : name,
                event_type : event_type,
                event_category : event_category,
                other : other,
                createdBy : mongoose.Types.ObjectId(req.token.organizerid),
                updatedBy : mongoose.Types.ObjectId(req.token.organizerid),
                timestamp : Date.now(),
                status : false
            };
            let createdEvent = await primary.model(constants.MODELS.events, eventModel).create(obj);
            return responseManager.onSuccess('Organizer event created successfully!', createdEvent, res);
        }else{
            return responseManager.badrequest({message : 'Invalid data to create event, please try again'}, res);
        }   
    }else{
        return responseManager.badrequest({ message: 'Invalid token to create event, please try again' }, res);
    }
});
router.post('/about', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, start_date, end_date, start_time, end_time, about_event } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            if(start_date && start_date != '' && end_date && end_date != ''){
                if(start_time && start_time != '' && end_time && end_time != ''){
                    if(about_event && about_event != ''){
                        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                        let obj = {
                            start_date : start_date,
                            end_date : end_date,
                            start_time : start_time,
                            end_time : end_time,
                            about_event : about_event
                        };
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), about : obj});
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                        return responseManager.onSuccess('Organizer event about data updated successfully!', eventData, res);
                    }else{
                        return responseManager.badrequest({message : 'About event data can not be empty for event about data, please try again'}, res);
                    }
                }else{
                    return responseManager.badrequest({message : 'Invalid start or end time for event about data, please try again'}, res);
                }
            }else{
                return responseManager.badrequest({message : 'Invalid start or end date for event about data, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event about data, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event about data, please try again' }, res);
    }
});
router.post('/arrangement', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, arrangements } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), arrangements : arrangements});
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            return responseManager.onSuccess('Organizer event arrangement data updated successfully!', eventData, res);
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event arrangement data, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event arrangement data, please try again' }, res);
    }
});
router.post('/location', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, flat_no, street_name, area_name, location_address, address, city, state, pincode, longitude, latitude } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            if(city && city.trim() != '' && state && state.trim() != '' && pincode && pincode != ''){
                if(latitude && latitude != '' && longitude && longitude != '' && validateLatLng(parseFloat(latitude), parseFloat(longitude))){
                    let obj = {
                        flat_no : flat_no,
                        street_name : street_name,
                        area_name : area_name,
                        location_address : location_address,
                        address : address,
                        city : city,
                        state : state,
                        pincode : pincode,
                        location: { type: "Point", coordinates: [longitude, latitude] }
                    };
                    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                    await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), event_location : obj});
                    let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                    return responseManager.onSuccess('Organizer event location data updated successfully!', eventData, res);
                }else{
                    return responseManager.badrequest({message : 'Invalid Lat-Long data to add event location data, please try again'}, res);
                }
            }else{
                return responseManager.badrequest({message : 'City, State or Pincode can not be empty to add event location data, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event location data, please try again'}, res);
        }
        
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event location data, please try again' }, res);
    }
});
router.post('/media', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, banner, photos, videos } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), banner : banner, photos : photos, videos: videos});
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            return responseManager.onSuccess('Organizer event media data updated successfully!', eventData, res);
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event media data, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event arrangement data, please try again' }, res);
    }
});
router.post('/permission', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, permission_letter, accept_booking } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), permission_letter : permission_letter, accept_booking : accept_booking});
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            return responseManager.onSuccess('Organizer event media data updated successfully!', eventData, res);
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event permission data, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event permission data, please try again' }, res);
    }
});
router.post('/discount', helper.authenticateToken, async (req, res) => {});
router.post('/companydetail', helper.authenticateToken, async (req, res) => {});
router.post('/personaldetail', helper.authenticateToken, async (req, res) => {});
router.post('/tandc', helper.authenticateToken, async (req, res) => {});
// media apis
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                if (filesizeinMb <= 3) {
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
                    return responseManager.badrequest({ message: 'Image file must be <= 3 MB, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
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
        return responseManager.badrequest({ message: 'Invalid token to upload video, please try again' }, res);
    }
});
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
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
                    return responseManager.badrequest({ message: 'Banner file must be <= 10 MB, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/document', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.docarray.includes(req.file.mimetype)) {
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
        return responseManager.badrequest({ message: 'Invalid token to upload document, please try again' }, res);
    }
});
module.exports = router;