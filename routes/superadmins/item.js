let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const itemModel = require('../../models/items.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.items, itemModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                lean: true
            }).then((items) => {
                return responseManager.onSuccess('Items list!', items, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get items list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { itemid, itemname, itemimage, description, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                let existingitem = await primary.model(constants.MODELS.items, itemModel).findOne({_id : {$ne : itemid}, itemname : itemname}).lean();
                if(existingitem == null){
                    let obj = {
                        itemname : itemname,
                        itemimage : itemimage,
                        description : description,
                        status : status,
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.items, itemModel).findByIdAndUpdate(itemid, obj);
                    return responseManager.onSuccess('Item updated sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Item name can not be identical, please try again' }, res);
                }
            }else{
                let existingitem = await primary.model(constants.MODELS.items, itemModel).findOne({itemname : itemname}).lean();
                if(existingitem == null) {
                    let obj = {
                        itemname : itemname,
                        itemimage : itemimage,
                        description : description,
                        status : status,
                        createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.items, itemModel).create(obj);
                    return responseManager.onSuccess('Item created sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Item name can not be identical, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to save items data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token save items data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { itemid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                await primary.model(constants.MODELS.items, itemModel).findByIdAndRemove(itemid);
                return responseManager.onSuccess('Item removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid item id to remove item data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove item data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.items, itemModel).find({}).then((itemslist) => {
                return responseManager.onSuccess('Items list!', itemslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get items list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { itemid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                let itemData = await primary.model(constants.MODELS.items, itemModel).findById(itemid);
                return responseManager.onSuccess('Item data!', itemData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid item id to get item data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get item data, please try again' }, res);
    }
});
module.exports = router;
