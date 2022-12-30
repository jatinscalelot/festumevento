let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const userModel = require('../../models/users.model');
const eventModel = require('../../models/events.model');
const eventcategoriesModel = require('../../models/eventcategories.model');
const organizerModel = require('../../models/organizers.model');
const eventwishlistModel = require('../../models/eventwishlists.model');
const itemModel = require('../../models/items.model');
const helper = require('../../utilities/helper');
const eventreviewModel = require('../../models/eventreviews.model');
const mongoose = require('mongoose');
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let existingwishlist = await primary.model(constants.MODELS.eventwishlists, eventwishlistModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                if (existingwishlist == null) {
                    let obj = {
                        eventid: mongoose.Types.ObjectId(eventid),
                        userid: mongoose.Types.ObjectId(req.token.userid),
                    };
                    await primary.model(constants.MODELS.eventwishlists, eventwishlistModel).create(obj);
                    return responseManager.onSuccess("Event wishlist placed successfully!", 1, res);
                } else {
                    await primary.model(constants.MODELS.eventwishlists, eventwishlistModel).findOneAndRemove({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                    return responseManager.onSuccess("Event wishlist remove successfully!", 1, res);
                }
            }else {
                return responseManager.badrequest({ message: 'Invalid event id to add or remove wishlist event data, please try again' }, res);
            }
        }else {
            return responseManager.badrequest({ message: 'Invalid user data to add or remove wishlist event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid user id to add or remove wishlist event data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let mywishlist = await primary.model(constants.MODELS.eventwishlists, eventwishlistModel).find({userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            let allEventsId = [];
            async.forEachSeries(mywishlist, (wishlist, next_wishlist) => {
                if(wishlist.eventid && wishlist.eventid != '' && mongoose.Types.ObjectId.isValid(wishlist.eventid)){
                    allEventsId.push(mongoose.Types.ObjectId(wishlist.eventid));
                }
                next_wishlist();
            }, () => {
                primary.model(constants.MODELS.events, eventModel).find({ _id : { $in : allEventsId }, status : true, is_approved: true, is_live: true}).populate(
                    [{
                        path : 'createdBy',
                        model : primary.model(constants.MODELS.organizers, organizerModel),
                        select : 'name email mobile profile_pic'
                    },{
                        path : 'event_category',
                        model : primary.model(constants.MODELS.eventcategories, eventcategoriesModel),
                        select : 'categoryname description event_type'
                    },{
                        path: "seating_arrangements.seating_item", 
                        model: primary.model(constants.MODELS.items, itemModel), 
                        select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                    }
                ]).select("name event_type event_category other about event_location banner seating_arrangements").lean().then((result) => {
                    let allEvents = [];
                    let currentTime = Date.now() + 19800000;
                    async.forEachSeries(result, (event, next_event) => {
                        event.startingat = 0.00;
                        async.forEachSeries(event.seating_arrangements, (seating_arrangement, next_seating_arrangement) => {
                            async.forEachSeries(seating_arrangement.arrangements, (arrangement, next_arrangement) => {
                                if(event.startingat != 0.00){
                                    if(event.startingat > arrangement.per_person_price){
                                        event.startingat = arrangement.per_person_price;
                                    }
                                }else{
                                    event.startingat = arrangement.per_person_price;
                                }
                                next_arrangement();
                            }, () => {
                                next_seating_arrangement();
                            });
                        }, () => {
                            event.startingat = parseFloat(event.startingat).toFixed(2);
                            delete event.seating_arrangements;
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
                                            allEvents.push(event);
                                        }
                                    }
                                }else{
                                    event.ratings = '0.0';
                                    if(event.about && event.about.start_timestamp && event.about.end_timestamp && (event.about.start_timestamp <= currentTime && event.about.end_timestamp >= currentTime)){
                                        allEvents.push(event);
                                    }else if(event.about && event.about.start_timestamp && event.about.end_timestamp && (event.about.start_timestamp > currentTime && event.about.end_timestamp > currentTime)){
                                        allEvents.push(event);
                                    }
                                }
                                next_event();
                            })().catch((error) => {console.log('error', error);})
                        });
                    }, () => {
                        return responseManager.onSuccess("Wishlist List", allEvents, res);
                    });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            });            
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event wishlist list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event wishlist list, please try again' }, res);
    }
});
module.exports = router;