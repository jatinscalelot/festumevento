const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const notificationModel = require('../../../models/notifications.model');
const settingModel = require('../../../models/settings.model');
const mongoose = require('mongoose');
exports.getsettings = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        const { notificationid } = req.query;
        console.log('notificationid', notificationid);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && (notificationData.usertype == 'eventusers' || notificationData.usertype == 'shopusers' || notificationData.usertype == 'onlineofferusers' || notificationData.usertype == 'livestreamusers')) {
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if (defaultSetting && defaultSetting.length > 0) {
                            console.log('11111111',{settings : defaultSetting, numberofusers : notificationData.numberofusers});
                            return responseManager.onSuccess('settings data', {settings : defaultSetting, numberofusers : notificationData.numberofusers}, res);
                        } else {
                            return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'allusers') {
                        if (notificationData.selected_plan && notificationData.selected_plan != '' && mongoose.Types.ObjectId.isValid(notificationData.selected_plan)) {
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            let planData = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(notificationData.selected_plan).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                console.log('2222',{settings : defaultSetting, planData : planData});
                                return responseManager.onSuccess('settings data', {settings : defaultSetting, planData : planData}, res);
                            } else {
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        } else if (notificationData.numberofusers) {
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                console.log('3333',{settings : defaultSetting, numberofusers : notificationData.numberofusers});
                                return responseManager.onSuccess('settings data', {settings : defaultSetting, numberofusers : notificationData.numberofusers}, res);
                            } else {
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'existingusers') {
                        let numberofusers = await primary.model(constants.MODELS.customerimports, customerimportModel).countDocuments({ notificationid: mongoose.Types.ObjectId(notificationid), selected: true });
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if (defaultSetting && defaultSetting.length > 0) {
                            console.log('4444',{settings : defaultSetting, numberofusers : numberofusers});
                            return responseManager.onSuccess('settings data', {settings : defaultSetting, numberofusers : numberofusers}, res);
                        } else {
                            return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification data to set notification user data, please try again' }, res);
                    }
                }else{
                    console.log('notificationData', notificationData);
                }
            } else {
                let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                if (defaultSetting && defaultSetting.length > 0) {
                    return responseManager.onSuccess('settings data', defaultSetting, res);
                } else {
                    return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get settings data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};