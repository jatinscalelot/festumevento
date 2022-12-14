const dotenv = require('dotenv').config();
const cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
let mongoose = require("mongoose");
var expressLayouts = require('express-ejs-layouts');
var indexRouter = require('./routes/index');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
mongoose.set('runValidators', true);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.once('open', () => {
  console.log("Well done! , connected with mongoDB database");
}).on('error', error => {
  console.log("Oops! database connection error:" + error);
});
app.use('/', indexRouter);
const adminpaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const landingpaths = [
  { pathUrl: '/getintouch', routeFile: 'getintouch'}
];
const executivepaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const organizerpaths = [
  { pathUrl: '/', routeFile: 'index' },
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/register', routeFile: 'register' },
  { pathUrl: '/profile', routeFile: 'profile'},
  { pathUrl: '/events', routeFile: 'events'},
  { pathUrl: '/discount', routeFile: 'discount' },
  { pathUrl: '/item', routeFile: 'item'},
  { pathUrl: '/categories', routeFile: 'categories'},
  { pathUrl: '/shopcategories', routeFile: 'shopcategories'},
  { pathUrl: '/shops', routeFile: 'shops'},
  { pathUrl: '/onlineoffer', routeFile: 'onlineoffer'},
  { pathUrl: '/offlineoffer', routeFile: 'offlineoffer'},
  { pathUrl: '/promotionplan', routeFile: 'promotionplan'},
  { pathUrl: '/notification', routeFile: 'notification'},
  { pathUrl: '/notificationcoupons', routeFile: 'notificationcoupons'},
  { pathUrl: '/platform', routeFile: 'platform'},
  { pathUrl: '/livestream', routeFile: 'livestream'},
  { pathUrl: '/subscriptions', routeFile: 'subscriptions'},
  { pathUrl: '/entertainment', routeFile: 'entertainment'},
  { pathUrl: '/search', routeFile: 'search' }
];
const subadminpaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const superadminpaths = [
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/item', routeFile: 'item' },
  { pathUrl: '/discount', routeFile: 'discount' },
  { pathUrl: '/eventcategories', routeFile: 'eventcategories' },
  { pathUrl: '/organizer', routeFile: 'organizer' },
  { pathUrl: '/event', routeFile: 'event' },
  { pathUrl: '/admin', routeFile: 'admin' },
  { pathUrl: '/subadmin', routeFile: 'subadmin' },
  { pathUrl: '/executive', routeFile: 'executive' },
  { pathUrl: '/shopcategories', routeFile: 'shopcategories'},
  { pathUrl: '/media', routeFile: 'media'},
  { pathUrl: '/promotionplans', routeFile: 'promotionplans'},
  { pathUrl: '/notificationcoupons', routeFile: 'notificationcoupons'},
  { pathUrl: '/eventbookingcoupons', routeFile: 'eventbookingcoupons'},
  { pathUrl: '/platform', routeFile: 'platform'},
  { pathUrl: '/subscriptions', routeFile: 'subscriptions'},
];
const userpaths = [ 
  { pathUrl: '/', routeFile: 'index'},
  { pathUrl: '/login', routeFile: 'login'},
  { pathUrl: '/register', routeFile: 'register'},
  { pathUrl: '/profile', routeFile: 'profile'},
  { pathUrl: '/event', routeFile: 'event'},
  { pathUrl: '/shopoffer', routeFile: 'shopoffer'},
  { pathUrl: '/onlineoffer', routeFile: 'onlineoffer'},
  { pathUrl: '/livestreaming', routeFile: 'livestreaming'},
  { pathUrl: '/eventwishlist', routeFile: 'eventwishlist'},
  { pathUrl: '/shopofferwishlist', routeFile: 'shopofferwishlist'},
  { pathUrl: '/onlineofferwishlist', routeFile: 'onlineofferwishlist'},
  { pathUrl: '/livestreamingwishlist', routeFile: 'livestreamingwishlist'},
  { pathUrl: '/search', routeFile: 'search'},
  { pathUrl: '/eventbookingcoupons', routeFile: 'eventbookingcoupons'},
  { pathUrl: '/eventbooking', routeFile: 'eventbooking'},
];
landingpaths.forEach((path) => {
	app.use('/landing'+path.pathUrl, require('./routes/landing/' + path.routeFile));
});
adminpaths.forEach((path) => {
	app.use('/admin'+path.pathUrl, require('./routes/admins/' + path.routeFile));
});
executivepaths.forEach((path) => {
	app.use('/executive'+path.pathUrl, require('./routes/executives/' + path.routeFile));
});
organizerpaths.forEach((path) => {
	app.use('/organizer'+path.pathUrl, require('./routes/organizers/' + path.routeFile));
});
subadminpaths.forEach((path) => {
	app.use('/subadmin'+path.pathUrl, require('./routes/subadmins/' + path.routeFile));
});
superadminpaths.forEach((path) => {
	app.use('/superadmin'+path.pathUrl, require('./routes/superadmins/' + path.routeFile));
});
userpaths.forEach((path) => {
	app.use('/user'+path.pathUrl, require('./routes/users/' + path.routeFile));
});
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
