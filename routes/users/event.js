let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
function validateLatLng(lat, lng) {
    let pattern = new RegExp('^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,6}');
    return pattern.test(lat) && pattern.test(lng);
};
router.post('/findevents', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { latitude, longitude, search } = req.body;
            if (latitude && longitude && latitude != '' && longitude != '' && latitude != null && longitude != null && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
                let query = {
                    "event_location.location": {
                        $geoWithin: {
                            $centerSphere: [
                                [
                                    parseFloat(longitude), parseFloat(latitude)
                                ],
                                (parseInt(100) * 0.62137119) / 3963.2
                            ]
                        }
                    }
                };
                primary.model(constants.MODELS.events, eventModel).find({
                    status: true,
                    $or: [
                        { name: { '$regex': new RegExp(search, "i") } },
                        { event_type: { '$regex': new RegExp(search, "i") } },
                        { other: { '$regex': new RegExp(search, "i") } },
                        { "about.about_event": { '$regex': new RegExp(search, "i") } },
                        { "event_location.flat_no": { '$regex': new RegExp(search, "i") } },
                        { "event_location.street_name": { '$regex': new RegExp(search, "i") } },
                        { "event_location.area_name": { '$regex': new RegExp(search, "i") } },
                        { "event_location.location_address": { '$regex': new RegExp(search, "i") } },
                        { "event_location.address": { '$regex': new RegExp(search, "i") } },
                        { "event_location.city": { '$regex': new RegExp(search, "i") } },
                        { "event_location.state": { '$regex': new RegExp(search, "i") } },
                        { "event_location.pincode": { '$regex': new RegExp(search, "i") } }
                    ],
                    ...query
                }).populate({
                    path : 'createdBy',
                    model : primary.model(constants.MODELS.organizers, organizerModel)
                }).lean().then((result) => {
                    return responseManager.onSuccess("event List", result, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Invalid token to find friends list, please try again' }, res);
            }
        }
    }
});