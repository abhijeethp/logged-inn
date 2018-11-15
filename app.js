var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var mysql = require("mysql");
var connectionObject = {
		host: "localhost",
		user: 'root',
		password: 'Abhijeeth29$',
		database: 'loggedinn',
		port: 3306
	};
var session = require("express-session");
var forEach = require('async-foreach').forEach;

// =====================
//      APP CONFIG
// =====================

// tells express to convet ejs files to html files
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));

// creates a session class
app.use(session({
	secret: "WEB mini project",
	resave: false,
	saveUninitialized: false
}));

app.use(function (req, res, next) {
	res.locals.currentUser = req.session.user;
	next();
});

// ================
//   INDEX ROUTES
// ================

// -----------------------x
// ROOT - show index page
// -----------------------x
app.get("/", function (req, res) {
	res.render("index");
});

app.post("/", function (req, res) {
	res.redirect("/hotels/"+req.body.lat+"/"+req.body.lng);
});

// -------x
// LOGIN
// -------x

//show login form
app.get("/login", function (req, res) {
	res.render("login");
});

//login logic
app.post("/login", function (req, res) {
	email = req.body.user.email;
	password = req.body.user.password;
	var query = "SELECT * FROM user WHERE email = ?";

	var connection = mysql.createConnection(connectionObject);
	connection.query(query, [email], function (err, results, fields) {
		if (err) { console.log(err); } 
		else {
			if(results.length>0){
				if(results[0].Password == password){
					req.session.user = results[0];
					res.redirect("/hotels/new");
				} else {
					connection.end();
					res.send("email does not match password");
				}
			} else {
				connection.end();
				res.send("email does not exist");
			}
		}
	});
});

// ---------x
// REGISTER
// ---------x

// show form to register
app.get("/register", function (req, res) {
	res.render("register");
});

// register logic
app.post("/register", function (req, res) {

	fname = req.body.user.fname;
	lname = req.body.user.lname;
	mobile = req.body.user.mobile;
	email = req.body.user.email;
	password = req.body.user.password;
	address = req.body.user.address;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err) {
		if(err){
			console.log(err)
		} else {
			var values = [[fname, lname, mobile, email, password, address]];
			var queryFields = "Fname, Lname, Mobile, Email, Password, Address";
			var query = "INSERT INTO user(" + queryFields + ") VALUES ?";
			connection.query(query, [values], function (err, result, fields) {
				if(err) {
					console.log(err);
				} else {
					console.log("User created");
					connection.end();
					res.redirect("/login");
				}
			});
		}
	});
});

// ----------x
//   LOGOUT
// ----------x
app.get("/logout", function (req, res) {
	delete req.session.user;
	res.redirect("/");
});

// ======================
//   HOTELS ROUTES
// ======================

// INDEX - show all hotels
app.get("/hotels/:lat/:lng", function (req, res) {

	var finalHotels = [];
	var semiFinalHotels = [];
	var lat = Number(req.params.lat);
	var lng = Number(req.params.lng);
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			var query1 = "select * from hotel where Hotel_latitude > " + (lat - 0.05) +" and Hotel_latitude < "+(lat+0.05);
			query1 += " and Hotel_longitude > " + (lng - 0.05) + "and Hotel_longitude < "+(lng + 0.05);
			connection.query(query1, function (err2, hotels, fields) {
				
				if (err2) { console.log(err2); } 
				else {
					
					forEach(hotels, function(hotel, index) {

						var query2 = "SELECT Suite_name FROM suite WHERE Hotel_id = "+hotel.Hotel_id;
						connection.query(query2, function (err3, suiteNames, index) {
							if (err3) { console.log(err3); }
							else{
								hotel.suiteNames = suiteNames;
								semiFinalHotels.push(hotel);
							}
						});
						var done = this.async();
						setTimeout(done, 50);
					}, 
					function (notAborted) {

						forEach(semiFinalHotels, function (hotel, index) {
							
							var query3 = "SELECT COUNT(*) FROM review WHERE Hotel_id ="+hotel.Hotel_id;
							connection.query(query3, function (err4, noOfReviews, index) {
								if (err4) { console.log(err4); }
								else{
									hotel.noOfReviews = noOfReviews[0]["COUNT(*)"];
									finalHotels.push(hotel);
								}
							});
							var done = this.async();
							setTimeout(done, 50);
						}, 
						function (notAborted2) {
							console.log(JSON.stringify(finalHotels));
							connection.end();
							res.render("hotels/index",{hotels: finalHotels});
						});
					});
				}
			});
		}
	});
});

// NEW - form to create a new restaurant
app.get("/hotels/new", isLoggedIn, function (req, res) {
	res.render("hotels/new");
});

// CREATE - creates a new restaurants
app.post("/hotels", isLoggedIn, function (req, res) {

	var Name = req.body.hotel.Name;
	var Logo = req.body.hotel.Logo;
	var Description = req.body.hotel.Description;
	var Rating = req.body.hotel.Rating;
	var lat = req.body.hotel.Lat;
	var lng = req.body.hotel.Lng;
	var roomService = req.body.hotel.RoomService;
	var restaurant = req.body.hotel.Restaurant;
	var internet = req.body.hotel.Internet;
	var gym = req.body.hotel.Gym;
	var pool = req.body.hotel.Pool;
	var doctor = req.body.hotel.Doctor;
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			var values = [[Name, Logo, Description, Rating, lat, lng, roomService, restaurant, internet, gym, pool, doctor]];
			var queryFields = "Hotel_name, Hotel_logo, Hotel_description, Hotel_rating, Hotel_latitude, Hotel_longitude, Hotel_room_service, Hotel_restaurant, Hotel_internet, Hotel_gym, Hotel_pool, Hotel_doctor";
			var query = "INSERT INTO hotel(" + queryFields + ") VALUES ?";
			connection.query(query, [values], function (err2, result, fields) {
				if(err2) { console.log(err2); } 
				else {
					console.log("Hotel Added");
					connection.end();
					res.redirect("/");
				}
			});
		}
	});
});

// SHOW - shows more information about one restaurants 
app.get("/restaurants/:id", function (req, res) {
	
	restaurantId = req.params.id;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			var query1 = "SELECT * FROM restaurant where Restaurant_id = "+restaurantId;
			connection.query(query1, function (err2, restaurant, fields1) {
				
				if (err2) { console.log(err2); } 
				else {
					restaurant = restaurant[0];
					
					var query2 = "SELECT * FROM menu WHERE Restaurant_id = " + restaurant.Restaurant_id;
					connection.query(query2, function (err3, menus, fields2) {
						if(err3) { console.log(err3); }
						else{
							restaurant.menus = menus;
							forEach(restaurant.menus, function (menu, index) {
								
								var query3 = "SELECT * FROM menu_item WHERE Menu_id = " + menu.Menu_id;
								connection.query(query3, function (err4, menuItems, fields3) {
									if (err4) { console.log(err4) } else {
											restaurant.menus[index].menuItems = menuItems;
										}	
								});
								var done = this.async();
								setTimeout(done, 50);
							}, function (notAborted) {
								
								var query4 = "SELECT r.*,DATE_FORMAT(r.Review_date,'%d/%m/%Y') AS niceDate, u.Fname  FROM review r, USER u WHERE r.Restaurant_id = "+restaurant.Restaurant_id+" and r.User_id = u.User_id";
								connection.query(query4, function (err5, reviews, fields4) {
									if (err5) { console.log(err5) } else {
										restaurant.reviews = reviews;
										console.log(JSON.stringify(restaurant));
										connection.end();
										res.render("restaurants/show", {restaurant:restaurant});
									}
								});
							});
						}
					});					
				}
			});
		}
	});
});

// =================
//   REVIEWS ROUTES
// =================

// NEW - form to create a new review for the particular restaurant
app.get("/restaurants/:id/reviews/new", isLoggedIn, function (req, res) {
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log("1"+err1); } 
		else {
			var query = "SELECT * FROM restaurant WHERE Restaurant_id = "+req.params.id;
			connection.query(query, function (err2, Restaurants, fields) {
				if (err2) { console.log(err2); } else {
					if(Restaurants.length<=0){
						res.send("restaurant does not exist");
					} else {
						console.log(Restaurants[0]);
						connection.end();
						res.render("reviews/new",{restaurant:Restaurants[0], user: req.session.user});
					}
				}
			});
		}
	});
});

// CREATE - creates a new review
app.post("/restaurants/:id/reviews", isLoggedIn, function (req, res) {
	
	var Review = req.body.review.Review;
	var Rating = req.body.review.Rating;
	var UserId = req.session.user.User_id;
	var RestaurantId = req.params.id;
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var queryFields = "Review_date, Review, Rating, User_id, Restaurant_id";
			var query = "INSERT INTO review("+queryFields+") VALUES (CURDATE(), '"+Review+"', "+Rating+", "+UserId+", "+RestaurantId+")";
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("review created");
					connection.end();
					res.redirect("/restaurants/"+RestaurantId);
				}
			});
		}
	});
});

// ================
//   MENU ROUTES
// ================

// NEW - form to create a new menu for the particular restaurant
app.get("/restaurants/:id/menus/new", isLoggedIn, function (req, res) {
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var query = "SELECT * FROM restaurant WHERE Restaurant_id = "+req.params.id;
			connection.query(query, function (err2, Restaurants, fields) {
				if (err2) { console.log(err2); } else {
					if(Restaurants.length<=0){
						res.send("restaurant does not exist");
					} else {
						console.log(Restaurants[0]);
						connection.end();
						res.render("menus/new",{restaurant:Restaurants[0]});
					}
				}
			});
		}
	});
});

// CREATE - creates a new menu
app.post("/restaurants/:id/menus", isLoggedIn, function (req, res) {
	
	var menuName = req.body.menu.Name;
	var RestaurantId = req.params.id;
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var values = [[menuName, RestaurantId]];
			var queryFields = "Menu_name, Restaurant_id";
			var query = "INSERT INTO menu("+queryFields+") VALUES ?";
			
			connection.query(query, [values], function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu created");
					connection.end();
					res.redirect("/restaurants/"+RestaurantId);
				}
			});
		}
	});
});

// DELETE - Deletes an existing menu
app.delete("/restaurants/:restaurantId/menus/:menuId", isLoggedIn, function (req, res) {
	
	var restaurantId = req.params.restaurantId;
	var menuId = req.params.menuId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {

			query = "DELETE FROM menu WHERE Menu_id="+menuId;
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu deleted");
					connection.end();
					res.redirect("/restaurants/"+restaurantId);
				}
			});
		}
	});
});

// ===================
//   MENU_ITEM ROUTES
// ===================

// NEW - form to create a new menu_item for a particular restaurant
app.get("/restaurants/:restaurantId/menus/:menuId/menu_items/new", isLoggedIn, function (req, res) {
	
	var restaurantId = req.params.restaurantId;
	var menuId = req.params.menuId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var query1 = "SELECT * FROM restaurant WHERE Restaurant_id = "+restaurantId;
			connection.query(query1, function (err2, Restaurants, fields) {
				if (err2) { console.log(err2); } else {
					if(Restaurants.length<=0){
						res.send("restaurant does not exist");
					} else {

						var query2 = "SELECT * FROM menu WHERE Menu_id = " + menuId;
						connection.query(query2, function (err3, menus, fields) {
							if(err3){ console.log(err3); } else {
								if(menus.length <= 0){
									connection.end();
									res.send("menu does not exist");
								} else {
									connection.end();
									res.render("menu_items/new",{restaurant:Restaurants[0], menu:menus[0]});
								}
							} 
						});
					}
				}
			});
		}
	});
});

// CREATE - creates a new menu_item for a particular restaurant
app.post("/restaurants/:restaurantId/menus/:menuId/menu_items", isLoggedIn, function (req, res) {
	
	var restaurantId = req.params.restaurantId;
	var menuId = req.params.menuId;

	var Name = req.body.menuItem.Name;
	var Image = req.body.menuItem.Image;
	var Veg = req.body.menuItem.Veg;
	console.log("diet-"+Veg);
	var Price = req.body.menuItem.Price;
	var Serves = req.body.menuItem.Serves;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if(err1){ console.log(err1); }
		else{
			var values =[[Name, Image, Veg, Price, Serves, menuId]];
			var queryFields = "Name, Image, Veg, Price, Serves, Menu_id";
			var query = "INSERT INTO menu_item("+queryFields+") VALUES ?";

			connection.query(query, [values], function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu_item added");
					connection.end();
					res.redirect("/restaurants/"+restaurantId);
				}
			});
		}
	});

});

// DELETE - Deletes an existing menu
app.delete("/restaurants/:restaurantId/menus/:menuId/menu_items/:menuItemId", function (req, res) {
	var restaurantId = req.params.restaurantId;
	var menuId = req.params.menuId;
	var menuItemId = req.params.menuItemId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {

			query = "DELETE FROM menu_item WHERE Menu_item_id="+menuItemId;
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu item deleted");
					connection.end();
					res.redirect("/restaurants/"+restaurantId);
				}
			});
		}
	});

});

// =================
//   AUTH FUNCTION
// =================
function isLoggedIn (req, res, next) {
	if(req.session.user){
		return next();
	} else {
		res.redirect("/login");
	}
}

// ================
//   RUN SERVER
// ================
app.listen(8080, function () {
	console.log("FPP server is running")
});




