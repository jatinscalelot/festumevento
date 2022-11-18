const eventModel = require('../../models/events.model');
const responseManager = require('../../utilities/response.manager');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const mongoose = require('mongoose');
function validateLatLng(lat, lng) {
    let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
    return pattern.test(lat) && pattern.test(lng);
};
exports.location = async (req, res) => {
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
};