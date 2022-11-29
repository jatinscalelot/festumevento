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
const notificationModel = require("../../models/notifications.model");
const csv = require("csvtojson");
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.notifications, notificationModel).paginate({
                $or: [
                    { notification_title: { '$regex': new RegExp(search, "i") } },
                    { description: { '$regex': new RegExp(search, "i") } }
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                lean: true
            }).then((notifications) => {
                return responseManager.onSuccess('Notifications list!', notifications, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get notification list, please try again' }, res);
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
            const { notificationid, notification_title, link, banner, description, status } = req.body;
            if (notification_title && link && notification_title.trim() != '' && link.trim() != '') {
                if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                    let obj = {
                        notification_title: notification_title,
                        banner: banner,
                        link: link,
                        description: description,
                        status: status,
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, obj);
                    let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                    if (notificationData && notificationData != null) {
                        return responseManager.onSuccess('Notification updated successfully!', notificationData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification id to update notification data, please try again' }, res);
                    }
                } else {
                    let obj = {
                        notification_title: notification_title,
                        banner: banner,
                        link: link,
                        description: description,
                        status: status,
                        payment: false,
                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let createdNotification = await primary.model(constants.MODELS.notifications, notificationModel).create(obj);
                    let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(createdNotification._id).lean();
                    if (notificationData && notificationData != null) {
                        return responseManager.onSuccess('Notification created successfully!', notificationData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification data to create notification, please try again' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'Notification title and link can not be empty to create notification, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to create or update notification data, please try again' }, res);
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
            const { notificationid } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData != null) {
                    return responseManager.onSuccess('Notification data!', notificationData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to get notification data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to get notification data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get notification data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/selectusertype', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, usertype } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && notificationData.usertype == usertype) {
                        return responseManager.onSuccess('Promotion user type set successfully', notificationData, res);
                    } else {
                        if (usertype == 'eventusers' || usertype == 'shopusers' || usertype == 'onlineofferusers' || usertype == 'livestreamusers' || usertype == 'allusers' || usertype == 'existingusers') {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { $unset: { numberofusers: 1, published_location: 1, selected_plan: 1, is_selected_all: 1, selected_users: 1 }, usertype: usertype });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user type set successfully', updatednotificationData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid notification usertype allowed types are eventuser, shopuser, onlineofferuser, livestreamuser, alluser and existinguser, please try again' }, res);
                        }
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get set notification user data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/selectusers', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, numberofusers, published_location, selected_plan, is_selected_all, selected_users } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && (notificationData.usertype == 'eventusers' || notificationData.usertype == 'shopusers' || notificationData.usertype == 'onlineofferusers' || notificationData.usertype == 'livestreamusers')) {
                        let numberofusersInt = (!isNaN(numberofusers)) ? parseInt(numberofusers) : 0;
                        if (numberofusersInt != 0) {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { numberofusers: numberofusersInt });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user count set successfully', updatednotificationData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid number of users to set notification user data, please try again' }, res);
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'allusers') {
                        if (selected_plan && selected_plan != '' && mongoose.Types.ObjectId.isValid(selected_plan)) {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { selected_plan: mongoose.Types.ObjectId(selected_plan) });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user plan set successfully', updatednotificationData, res);
                        } else if (numberofusers) {
                            let numberofusersInt = (!isNaN(numberofusers)) ? parseInt(numberofusers) : 0;
                            if (numberofusersInt != 0 && published_location != '') {
                                await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { numberofusers: numberofusersInt, published_location: published_location });
                                let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                                return responseManager.onSuccess('Promotion user location and numbers set successfully', updatednotificationData, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid number of users or publish location to set notification user data, please try again' }, res);
                            }
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'existingusers') {
                        if (is_selected_all == true) {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { is_selected_all: is_selected_all });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user all user set successfully', updatednotificationData, res);
                        } else {
                            if (selected_users && selected_users.length > 0) {
                                await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { is_selected_all: false, selected_users: selected_users });
                                let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                                return responseManager.onSuccess('Promotion user all ids set successfully', updatednotificationData, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid selected to set notification user data please select atleast one user to send notification, please try again' }, res);
                            }
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification data to set notification user data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get set notification user data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/setschedule', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, notification_date, notification_time, is_notification, is_email, is_sms } = req.body;
            let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
            if (notificationData && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                if(notificationData.payment == false){
                    let newdate = notification_date + ' ' + notification_time;
                    const finalDate = new Date(newdate);
                    let notification_timestamp = finalDate.getTime();
                    await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { 
                        notification_date : notification_date,
                        notification_time : notification_time,
                        notification_timestamp : notification_timestamp,
                        is_notification : is_notification,
                        is_email : is_email,
                        is_sms : is_sms 
                    });
                    let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                    return responseManager.onSuccess('Promotion schedule set successfully', updatednotificationData, res);
                }else{
                    let newdate = notification_date + ' ' + notification_time;
                    const finalDate = new Date(newdate);
                    let notification_timestamp = finalDate.getTime();
                    await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { 
                        notification_date : notification_date,
                        notification_time : notification_time,
                        notification_timestamp : notification_timestamp
                    });
                    let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                    return responseManager.onSuccess('Promotion schedule set successfully', updatednotificationData, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to set notification schedule, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set notification schedule, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/import', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {

});
router.post('/usertype', helper.authenticateToken, async (req, res) => {

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
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'notification').then((result) => {
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
            return responseManager.badrequest({ message: 'Invalid organizerid to upload shop banner, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to upload shop banner, please try again' }, res);
    }
});
module.exports = router;