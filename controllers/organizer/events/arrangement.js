const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const itemModel = require('../../../models/items.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
const async = require('async');
exports.arrangement = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, seating_arrangements } = req.body;
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let finalArrangements = [];
                if(seating_arrangements && seating_arrangements.length > 0){
                    async.forEachSeries(seating_arrangements, (arrangement, next_arrangement) => {
                        arrangement.seating_item = mongoose.Types.ObjectId(arrangement.seating_item);
                        finalArrangements.push(arrangement);
                        next_arrangement();
                    }, () => {
                        ( async () => {
                            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), seating_arrangements : finalArrangements});
                            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                                path: "seating_arrangements.seating_item", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                            }).lean();
                            if(eventData && eventData != null){
                                return responseManager.onSuccess('Organizer event arrangement data updated successfully!', {_id : eventData._id, seating_arrangements: eventData.seating_arrangements}, res);
                            }else{
                                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                            }
                        })().catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    });
                }else{
                    return responseManager.badrequest({message : 'Invalid seating_arrangements data to update event arrangement data, please try again'}, res);
                }
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
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "seating_arrangements.seating_item", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                if(eventData && eventData != null){
                    return responseManager.onSuccess('Organizer event data!', {_id : eventData._id, seating_arrangements : eventData.seating_arrangements}, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event seating_arrangements, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};