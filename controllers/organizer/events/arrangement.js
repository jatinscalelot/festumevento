const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.arrangement = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid, arrangements } = req.body;
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), arrangements : arrangements});
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                return responseManager.onSuccess('Organizer event arrangement data updated successfully!', {_id : eventData._id, arrangements: eventData.arrangements}, res);
            }else{
                return responseManager.badrequest({message : 'Invalid event id to add event arrangement data, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event arrangement data, please try again' }, res);
    }
};
exports.getarrangement = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                return responseManager.onSuccess('Organizer event data!', {_id : eventData._id, arrangements : eventData.arrangements}, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event arrangements, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};