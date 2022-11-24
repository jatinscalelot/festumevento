const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/eventcategories.model');
const mongoose = require('mongoose');
exports.createevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, name, event_type, event_category, other } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                if (name && name.trim() != '' && event_type && event_type.trim() != '' && ((event_category && event_category.trim() != '') || (other && other.trim() != ''))) {
                    if(event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)){
                        let obj = {
                            name: name,
                            event_type: event_type,
                            event_category: mongoose.Types.ObjectId(event_category),
                            other: other,
                            updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                        };
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, obj);
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                            path: "event_category",
                            model: primary.model(constants.MODELS.categories, categoryModel),
                            select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                        }).lean();
                        return responseManager.onSuccess('Organizer event updated successfully!', {_id : eventData._id, name: eventData.name, event_type: eventData.event_type, event_category : eventData.event_category, other: eventData.other, status : eventData.status}, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event category to update event, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to update event, please try again' }, res);
                }
            } else {
                if (name && name.trim() != '' && event_type && event_type.trim() != '' && ((event_category && event_category.trim() != '') || (other && other.trim() != ''))) {
                    if(event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)){
                        let obj = {
                            name: name,
                            event_type: event_type,
                            event_category: mongoose.Types.ObjectId(event_category),
                            other: other,
                            createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                            updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                            timestamp: Date.now(),
                            status: false
                        };
                        let createdEvent = await primary.model(constants.MODELS.events, eventModel).create(obj);
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(createdEvent._id).populate({
                            path: "event_category",
                            model: primary.model(constants.MODELS.categories, categoryModel),
                            select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                        }).lean();
                        return responseManager.onSuccess('Organizer event created successfully!', eventData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event category to create event, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to create event, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to create event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or update event, please try again' }, res);
    }
};
exports.getevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if(organizerData && organizerData.status == true && organizerData.mobileverified == true){
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "event_category",
                    model: primary.model(constants.MODELS.categories, categoryModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                return responseManager.onSuccess('Organizer event data!', {_id : eventData._id, name: eventData.name, event_type: eventData.event_type, event_category : eventData.event_category, other: eventData.other}, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};