const eventModel = require('../../../models/events.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.permission = async (req, res) => {
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
};