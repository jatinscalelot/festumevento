let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const subscriptionModel = require('../../models/subscriptions.model');
const organizerModel = require('../../models/organizers.model');
const mongoose = require('mongoose');
router.get('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            primary.model(constants.MODELS.subscriptions, subscriptionModel).find({ status: true }).lean().then((subscriptionslist) => {
                return responseManager.onSuccess('subscriptions list!', subscriptionslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get subscriptions list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { subscriptionid } = req.body;
            if (subscriptionid && subscriptionid != '' && mongoose.Types.ObjectId.isValid(subscriptionid)) {
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                primary.model(constants.MODELS.subscriptions, subscriptionModel).findById(subscriptionid).lean().then((subscription) => {
                    return responseManager.onSuccess('subscription data!', subscription, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.unauthorisedRequest(res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get subscription, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;