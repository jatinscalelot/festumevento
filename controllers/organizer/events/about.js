const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.aboutevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, start_date, end_date, start_time, end_time, about_event } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                if (start_date && start_date != '' && end_date && end_date != '') {
                    if (start_time && start_time != '' && end_time && end_time != '') {
                        if (about_event && about_event != '') {
                            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                            let xstart_date = start_date.split("-");
                            let startTimestamp = new Date(xstart_date[1]+'-'+xstart_date[2]+'-'+xstart_date[0]+' '+start_time).getTime();
                            let yend_date = end_date.split("-");
                            let endTimestamp = new Date(yend_date[1]+'-'+yend_date[2]+'-'+yend_date[0]+' '+end_time).getTime();
                            let obj = {
                                start_date: start_date,
                                end_date: end_date,
                                start_time: start_time,
                                end_time: end_time,
                                about_event: about_event,
                                start_timestamp : startTimestamp,
                                end_timestamp : endTimestamp,
                            };
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), about: obj });
                            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                            if(eventData && eventData != null){
                                return responseManager.onSuccess('Organizer event about data updated successfully!', { _id : eventData._id, about: eventData.about}, res);
                            }else{
                                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'About event data can not be empty for event about data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid start or end time for event about data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid start or end date for event about data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to add event about data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event about data, please try again' }, res);
    }
};
exports.getaboutevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                if(eventData && eventData != null){
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, about: eventData.about }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get about event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};