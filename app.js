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

// ================x
//   INDEX ROUTES
// ================x

// -----------------------
// ROOT - show index page
// -----------------------
app.get("/", function (req, res) {
	res.render("index");
});

app.post("/", function (req, res) {
	res.redirect("/hotels/"+req.body.lat+"/"+req.body.lng);
});

// -------
// LOGIN
// -------

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
					res.redirect("/");
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

// ---------
// REGISTER
// ---------

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

// ======================x
//   HOTELS ROUTES
// ======================x

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
			query1 += " and Hotel_longitude > " + (lng - 0.05) + " and Hotel_longitude < "+(lng + 0.05);
			connection.query(query1, function (err2, hotels, fields) {
				
				if (err2) { console.log(err2); } 
				else {
					
					forEach(hotels, function(hotel, index) {

						var query2 = "SELECT Category_name FROM category WHERE Hotel_id = "+hotel.Hotel_id;
						connection.query(query2, function (err3, categoryNames, index) {
							if (err3) { console.log(err3); }
							else{
								hotel.categoryNames = categoryNames;
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
							connection.end();
							res.render("hotels/index",{hotels: finalHotels});
						});
					});
				}
			});
		}
	});
});

// NEW - form to create a new hotel
app.get("/hotels/new", isLoggedIn, function (req, res) {
	res.render("hotels/new");
});

// CREATE - creates a new hotel
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

// SHOW - shows more information about one hotel
app.get("/hotels/:id", function (req, res) {
	
	hotelId = req.params.id;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			var query1 = "SELECT * FROM hotel where Hotel_id = "+hotelId;
			connection.query(query1, function (err2, hotel, fields1) {
				
				if (err2) { console.log(err2); } 
				else {
					hotel = hotel[0];
					
					var query2 = "SELECT * FROM category WHERE Hotel_id = " + hotel.Hotel_id;
					connection.query(query2, function (err3, categories, fields2) {
						if(err3) { console.log(err3); }
						else{
							hotel.categories = categories;
							forEach(hotel.categories, function (category, index) {
								
								var query3 = "SELECT * FROM room WHERE Category_id = " + category.Category_id;
								connection.query(query3, function (err4, rooms, fields3) {
									if (err4) { console.log(err4) } else {
											hotel.categories[index].rooms = rooms;
										}	
								});
								var done = this.async();
								setTimeout(done, 50);
							}, function (notAborted) {
								var query4 = "SELECT r.*,DATE_FORMAT(r.Review_date,'%d/%m/%Y') AS niceDate, u.Fname  FROM review r, USER u WHERE r.Hotel_id = "+hotel.Hotel_id+" and r.User_id = u.User_id";
								connection.query(query4, function (err5, reviews, fields4) {
									if (err5) { console.log(err5) } else {
										hotel.reviews = reviews;
										connection.end();
										res.render("hotels/show", {hotel:hotel});
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

// =================x
//   REVIEWS ROUTES
// =================x

// NEW - form to create a new review for the particular hotel
app.get("/hotels/:id/reviews/new", isLoggedIn, function (req, res) {
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log("1"+err1); } 
		else {
			var query = "SELECT * FROM hotel WHERE Hotel_id = "+req.params.id;
			connection.query(query, function (err2, hotels, fields) {
				if (err2) { console.log(err2); } else {
					if(hotels.length<=0){
						res.send("hotel does not exist");
					} else {
						connection.end();
						res.render("reviews/new",{hotel:hotels[0], user: req.session.user});
					}
				}
			});
		}
	});
});

// CREATE - creates a new review
app.post("/hotels/:id/reviews", isLoggedIn, function (req, res) {
	
	var Review = req.body.review.Review;
	var Rating = req.body.review.Rating;
	var UserId = req.session.user.User_id;
	var hotelId = req.params.id;
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var queryFields = "Review_date, Review_text, Review_rating, User_id, Hotel_id";
			var query = "INSERT INTO review("+queryFields+") VALUES (CURDATE(), '"+Review+"', "+Rating+", "+UserId+", "+hotelId+")";
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("review created");
					connection.end();
					res.redirect("/hotels/"+hotelId);
				}
			});
		}
	});
});

// =================x
//   CATEGORY ROUTES
// =================x

// NEW - form to create a new category for the particular hotel
app.get("/hotels/:id/categories/new", isLoggedIn, function (req, res) {
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var query = "SELECT * FROM hotel WHERE Hotel_id = "+req.params.id;
			connection.query(query, function (err2, hotels, fields) {
				if (err2) { console.log(err2); } else {
					if(hotels.length<=0){
						res.send("hotel does not exist");
					} else {
						connection.end();
						res.render("categories/new",{hotel:hotels[0]});
					}
				}
			});
		}
	});
});

// CREATE - creates a new category
app.post("/hotels/:id/categories", isLoggedIn, function (req, res) {
	
	var categoryName = req.body.category.Name;
	var hotelId = req.params.id;
	
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var values = [[categoryName, hotelId]];
			var queryFields = "Category_name, Hotel_id";
			var query = "INSERT INTO category("+queryFields+") VALUES ?";
			
			connection.query(query, [values], function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("category created");
					connection.end();
					res.redirect("/hotels/"+hotelId);
				}
			});
		}
	});
});

// DELETE - Deletes an existing category
app.delete("/hotels/:hotelId/categories/:categoryId", isLoggedIn, function (req, res) {
	
	var hotelId = req.params.hotelId;
	var categoryId = req.params.categoryId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {

			query = "DELETE FROM category WHERE Category_id="+categoryId;
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("category deleted");
					connection.end();
					res.redirect("/hotels/"+hotelId);
				}
			});
		}
	});
});

// ===================x
//   ROOM ROUTES
// ===================x

// NEW - form to create a new menu_item for a particular restaurant
app.get("/hotels/:hotelId/categories/:categoryId/rooms/new", isLoggedIn, function (req, res) {
	
	var hotelId = req.params.hotelId;
	var categoryId = req.params.categoryId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {
			
			var query1 = "SELECT * FROM hotel WHERE Hotel_id = "+hotelId;
			connection.query(query1, function (err2, hotels, fields) {
				if (err2) { console.log(err2); } else {
					if(hotels.length<=0){
						res.send("hotel does not exist");
					} else {
						var query2 = "SELECT * FROM category WHERE Category_id = " + categoryId;
						connection.query(query2, function (err3, categories, fields) {
							if(err3){ console.log(err3); } else {
								if(categories.length <= 0){
									connection.end();
									res.send("category does not exist");
								} else {
									connection.end();
									res.render("rooms/new",{hotel:hotels[0], category:categories[0]});
								}
							} 
						});
					}
				}
			});
		}
	});
});

// CREATE - creates a new room for a particular hotel in a particular category
app.post("/hotels/:hotelId/categories/:categoryId/rooms", isLoggedIn, function (req, res) {
	
	var hotelId = req.params.hotelId;
	var categoryId = req.params.categoryId;

	var name = req.body.room.Name;
	var image = req.body.room.Image;
	var length = req.body.room.Length; 
	var breadth = req.body.room.Breadth; 
	var price = req.body.room.Price; 
	var accomodates = req.body.room.Accomodates;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if(err1){ console.log(err1); }
		else{
			var values =[[name, image, length, breadth, price, accomodates, categoryId]];
			var queryFields = "Room_name, Room_image, Room_length, Room_breadth, Room_price, Room_accomodates, Category_id";
			var query = "INSERT INTO room("+queryFields+") VALUES ?";

			connection.query(query, [values], function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("room added");
					connection.end();
					res.redirect("/hotels/"+hotelId);
				}
			});
		}
	});

});

// DELETE - Deletes an existing room
app.delete("/hotels/:hotelId/categories/:categoryId/rooms/:roomId", function (req, res) {
	var hotelId = req.params.hotelId;
	var roomId = req.params.roomId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); } 
		else {

			query = "DELETE FROM room WHERE Room_id="+roomId;
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("room deleted");
					connection.end();
					res.redirect("/hotels/"+hotelId);
				}
			});
		}
	});

});

// =================x
//   AUTH FUNCTION
// =================x
function isLoggedIn (req, res, next) {
	if(req.session.user){
		return next();
	} else {
		res.redirect("/login");
	}
}

// ================x
//   RUN SERVER
// ================x
app.listen(8080, function () {
	console.log("server is running")
});




