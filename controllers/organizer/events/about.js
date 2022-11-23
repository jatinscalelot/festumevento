const eventModel = require('../../../models/events.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.aboutevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
};
exports.getaboutevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
            return responseManager.onSuccess('Organizer event data!',{_id : eventData._id, about : eventData.about}, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
}