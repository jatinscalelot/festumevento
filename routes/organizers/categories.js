let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const categoryModel = require('../../models/eventcategories.model');
const organizerModel = require('../../models/organizers.model');
const mongoose = require('mongoose');
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { event_type } = req.body;
        let query = {};
        if (event_type && event_type != 'all') {
            query.event_type = event_type;
        }
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            primary.model(constants.MODELS.eventcategories, categoryModel).find({ status: true, ...query }).lean().then((eventcategories) => {
                return responseManager.onSuccess('Eventcategories list!', eventcategories, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get categories list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { categoryid } = req.body;
        if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
            if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
                primary.model(constants.MODELS.eventcategories, categoryModel).findById(categoryid).lean().then((category) => {
                    return responseManager.onSuccess('Category data!', category, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid organizerid to get category, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;