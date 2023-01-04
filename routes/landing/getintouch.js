let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const getintouchModel = require('../../models/getintouches.model');
router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, company_name, email, description } = req.body;
    if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && company_name && company_name.trim() != '' && description && description.trim() != '') {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.getintouches, getintouchModel).findOne({email: email}).lean();
        if (checkExisting == null) {
            let obj = {
                name: name,
                email: email,
                company_name: company_name,
                description: description,
            };
            await primary.model(constants.MODELS.getintouches, getintouchModel).create(obj);
            return responseManager.onSuccess('Thank you for getting in touch. we will reply by email as soon as possible.', 1, res);
        } else {
            return responseManager.badrequest({ message: 'User already send to query with same email, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to send query, please try again' }, res);
    }
});
module.exports = router;