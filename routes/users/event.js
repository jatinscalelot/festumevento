let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const eventcategoriesModel = require('../../models/eventcategories.model');
const eventreviewModel = require('../../models/eventreviews.model');
const eventwishlistModel = require('../../models/eventwishlists.model');
const itemModel = require('../../models/items.model');
const mongoose = require('mongoose');
const async = require('async');
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
                }).populate([{
                    path : 'createdBy',
                    model : primary.model(constants.MODELS.organizers, organizerModel),
                    select : 'name email mobile profile_pic'
                },{
                    path : 'event_category',
                    model : primary.model(constants.MODELS.eventcategories, eventcategoriesModel),
                    select : 'categoryname description'
                },{
                    path: "seating_arrangements.seating_item", 
                    model: primary.model(constants.MODELS.items, itemModel), 
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }]).select("name event_type event_category other about event_location banner seating_arrangements").lean().then((result) => {
                    let allEvents = [];
                    let upcomingEvents = [];
                    let currentTime = Date.now() + 19800000;
                    async.forEachSeries(result, (event, next_event) => {
                        ( async () => {
                            let wishlist = await primary.model(constants.MODELS.eventwishlists, eventwishlistModel).findOne({eventid : mongoose.Types.ObjectId(event._id), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
                            event.wishlist_status = (wishlist == null) ? false : true; 
                            let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({eventid : mongoose.Types.ObjectId(event._id)}));
                            if(noofreview > 0){
                                let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: {eventid : mongoose.Types.ObjectId(event._id)} },{ $group: { _id : null, sum : { $sum: "$ratings" } } }]);
                                if(totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum){
                                    event.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                    if(event.about && event.about.start_timestamp && event.about.end_timestamp && (event.about.start_timestamp <= currentTime && event.about.end_timestamp >= currentTime)){
                                        allEvents.push(event);
                                    }else if(event.about && event.about.start_timestamp && event.about.end_timestamp && (event.about.start_timestamp > currentTime && event.about.end_timestamp > currentTime)){
                                        upcomingEvents.push(event);
                                    }
                                }
                            }else{
                                event.ratings = '0.0';
                                if(event.about && event.about.start_timestamp && event.about.end_timestamp && (event.about.start_timestamp <= currentTime && event.about.end_timestamp >= currentTime)){
                                    allEvents.push(event);
                                }else if(event.about && event.about.start_timestamp && event.about.end_timestamp && (event.about.start_timestamp > currentTime && event.about.end_timestamp > currentTime)){
                                    upcomingEvents.push(event);
                                }
                            }
                            next_event();
                        })().catch((error) => {console.log('error', error);})
                    }, () => {
                        return responseManager.onSuccess("event List", {events : allEvents, upcomingEvents : upcomingEvents}, res);
                    });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Invalid latitude and logitude to find events near by you, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid user request to find events near by you, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to find events near by you, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([{
                    path : 'createdBy',
                    model : primary.model(constants.MODELS.organizers, organizerModel),
                    select : 'name email mobile profile_pic'
                },{
                    path : 'event_category',
                    model : primary.model(constants.MODELS.eventcategories, eventcategoriesModel),
                    select : 'categoryname description'
                },{
                    path: "seating_arrangements.seating_item", 
                    model: primary.model(constants.MODELS.items, itemModel), 
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }]).lean().then((result) => {
                    ( async () => {
                        let wishlist = await primary.model(constants.MODELS.eventwishlists, eventwishlistModel).findOne({eventid : mongoose.Types.ObjectId(eventid), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
                        result.wishlist_status = (wishlist == null) ? false : true;
                        let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({eventid : mongoose.Types.ObjectId(eventid)}));
                        if(noofreview > 0){
                            let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: {eventid : mongoose.Types.ObjectId(eventid)} },{ $group: { _id : null, sum : { $sum: "$ratings" } } }]);
                            if(totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum){
                                result.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                            }
                        }else{
                            result.ratings = '0.0';
                        }
                        let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({eventid : mongoose.Types.ObjectId(eventid)}).populate({path : 'userid', model : primary.model(constants.MODELS.users, userModel), select : "name mobile profilepic"}).lean();
                        result.reviews = allreview;
                        return responseManager.onSuccess("event data", result, res);
                    })().catch((error) => {
                        return responseManager.onError(error, res);
                    });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid user id to find event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
router.post('/rate', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid, ratings, title, review } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let existingreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({eventid : mongoose.Types.ObjectId(eventid), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
                console.log('existingreview', existingreview);
                if(existingreview == null){
                    if(!isNaN(ratings) && title && title.trim() != '' && review && review.trim() != ''){
                        let obj = {
                            eventid : mongoose.Types.ObjectId(eventid),
                            userid : mongoose.Types.ObjectId(req.token.userid),
                            ratings : parseFloat(ratings),
                            title : title,
                            review : review,
                            timestamp : Date.now()
                        };
                        await primary.model(constants.MODELS.eventreviews, eventreviewModel).create(obj);
                        return responseManager.onSuccess("Event review placed successfully!", 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Invalid data to place review for the event, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Review already register for the event, please try again with other event' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to rate event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid user id to rate event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to rate event data, please try again' }, res);
    }
});
module.exports = router;