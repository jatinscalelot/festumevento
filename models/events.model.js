let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let discountSchema = new mongoose.Schema({
	discountname: { 
        type: String,
		trim: true,
		required: true,
    },
    discounttype: { 
        type: String,
		trim: true,
		required: true,
    },
    description: { 
        type: String,
        default: ''
    },
    discount: { 
        type: String,
		trim: true,
		required: true,
    },
    tandc: { 
        type: String,
		default: ''
    },
    items:[]
}, { _id: false });
let schema = new mongoose.Schema({
    event_category : {
        type: mongoose.Types.ObjectId,
		default: null
    },
    event_location : {
        location: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number]
            }
        }
    },
    discounts : [discountSchema],
	createdBy: {
		type: mongoose.Types.ObjectId,
		default: null
	},
	updatedBy: {
		type: mongoose.Types.ObjectId,
		default: null
	}
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
schema.index({ "event_location.location" : "2dsphere" });
module.exports = schema;