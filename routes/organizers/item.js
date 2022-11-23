let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const itemModel = require('../../models/items.model');
const mongoose = require('mongoose');
router.get('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        primary.model(constants.MODELS.items, itemModel).find({status : true}).lean().then((items) => {
            return responseManager.onSuccess('Items list!', items, res);
        }).catch((error) => {
            return responseManager.onError(error, res);
        });
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { itemid } = req.body;
        if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            primary.model(constants.MODELS.items, itemModel).findById(itemid).lean().then((item) => {
                return responseManager.onSuccess('Item data!', item, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;