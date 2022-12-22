const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
function validateLatLng(lat, lng) {
    let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
    return pattern.test(lat) && pattern.test(lng);
};
exports.location = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, flat_no, street_name, area_name, city, state, pincode, longitude, latitude } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                if (city && city.trim() != '' && state && state.trim() != '' && pincode && pincode != '') {
                    if (latitude && latitude != '' && longitude && longitude != '' && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
                        let obj = {
                            flat_no: flat_no,
                            street_name: street_name,
                            area_name: area_name,
                            city: city,
                            state: state,
                            pincode: pincode,
                            location: { type: "Point", coordinates: [longitude, latitude] }
                        };
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), event_location: obj });
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                        if(eventData && eventData != null){
                            return responseManager.onSuccess('Organizer event location data updated successfully!', {_id : eventData._id, event_location : eventData.event_location}, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid Lat-Long data to add event location data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'City, State or Pincode can not be empty to add event location data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to add event location data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event location data, please try again' }, res);
    }
};
exports.getlocation = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                if(eventData && eventData != null){
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, event_location: eventData.event_location }, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event location details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};