let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const dicountModel = require('../../models/discounts.model');
const itemModel = require('../../models/items.model');
router.get('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        primary.model(constants.MODELS.discounts, dicountModel).find({status : true}).populate({
            path: "items",
            model: primary.model(constants.MODELS.items, itemModel),
            select: '-createdAt -updatedAt -__v -createdBy -updatedBy'
        }).lean().then((dicsounts) => {
            return responseManager.onSuccess('Discount list!', dicsounts, res);
        }).catch((error) => {
            return responseManager.onError(error, res);
        });
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;