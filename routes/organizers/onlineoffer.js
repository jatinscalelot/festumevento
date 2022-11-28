var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const shopModel = require('../../models/shops.model');
const shopcategoryModel = require('../../models/shopcategories.model');
const onlineofferModel = require('../../models/onlineoffers.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { shopid } = req.body;
            if(shopid && shopid != '' && mongoose.Types.ObjectId.isValid(shopid)){

            }else{
                return responseManager.badrequest({ message: 'Invalid shop id to get online offer list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer id to get online offer list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;