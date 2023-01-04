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
const eventbookingModel = require('../../models/eventbookings.model'); 
const mongoose = require('mongoose');
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let body = req.body;
            body.createdBy = mongoose.Types.ObjectId(req.token.userid);
            body.updatedBy = mongoose.Types.ObjectId(req.token.userid);
            body.timestamp = Date.now();
            let addedEventBokking = await primary.model(constants.MODELS.eventbookings, eventbookingModel).create(body);
            return responseManager.onSuccess("event booked successfully...", addedEventBokking, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid user request to book event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to book event, please try again' }, res);
    }
});
module.exports = router;