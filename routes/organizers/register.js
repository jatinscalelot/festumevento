let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
router.post('/', async (req, res, next) => {
    const { name, email, mobile, country_code, password, refer_code, fcm_token } = req.body;
    if(name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && mobile && mobile.length == 10 && country_code && country_code.trim() != '' && password && password.length >= 6){
        let ecnPassword = await helper.passwordEncryptor(password);
        let my_referCode = await helper.makeid(6);
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({  $or: [ {mobile: mobile}, {email: email} ] }).lean();
        if(checkExisting == null){
            let obj = {
                name : name,
                email : email,
                mobile : mobile,
                country_code : country_code,
                password : ecnPassword,
                refer_code : refer_code,
                my_refer_code : my_referCode,
                fcm_token : fcm_token,
                status : false,
            };
            await primary.model(constants.MODELS.organizers, organizerModel).create(obj);
            return responseManager.onSuccess('Organizer register successfully!', 1, res);
        }else{
            return responseManager.badrequest({message : 'Organizer already exist with same mobile or email, Please try again...'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid data to register organizer, please try again'}, res);
    } 
});
module.exports = router;
