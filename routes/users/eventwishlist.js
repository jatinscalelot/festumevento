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
                primary.model(constants.MODELS.events, eventModel).find({ _id : { $in : allEventsId }}).populate(
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
                    return responseManager.onSuccess("Wishlist List", result, res);
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