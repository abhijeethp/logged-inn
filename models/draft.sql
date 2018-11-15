drop database loggedinn;
create database loggedinn;
use loggedinn;

-- creation
CREATE TABLE user (

	User_id INT AUTO_INCREMENT PRIMARY KEY,
	Fname VARCHAR(20) not null,
	Lname VARCHAR(20) not null,
	Mobile BIGINT(15) not null,
	Email VARCHAR(30) not null,
	Password VARCHAR(20) not null,
	Address VARCHAR(100) not null,
	unique(Email),
	unique(Mobile)

);

CREATE TABLE hotel (
	Hotel_id INT AUTO_INCREMENT PRIMARY KEY,
	Hotel_name VARCHAR(50) not null,
	Hotel_logo VARCHAR(200) not null,
	Hotel_description VARCHAR(200) not null,
	Hotel_rating INT not null,
	Hotel_latitude FLOAT not null,
	Hotel_longitude FLOAT not null,
	Hotel_room_service BOOLEAN NOT NULL,
	Hotel_restaurant BOOLEAN NOT NULL,
	Hotel_internet BOOLEAN NOT NULL,
	Hotel_gym BOOLEAN NOT NULL,
	Hotel_pool BOOLEAN NOT NULL,
	Hotel_doctor BOOLEAN NOT NULL
);

CREATE TABLE category (
	Category_id INT AUTO_INCREMENT PRIMARY KEY,
	Category_name Varchar(50) not null,
	Hotel_id INT,
	FOREIGN KEY(Hotel_id) REFERENCES hotel(Hotel_id) ON DELETE CASCADE
);

CREATE TABLE room (
	Room_id INT AUTO_INCREMENT PRIMARY KEY,
	Room_name VARCHAR(50) not null,
	Room_image varchar(200) not null, 
	Room_length INT NOT NULL,
	Room_breadth INT NOT NULL,
	Room_price INT not null,
	Room_accomodates INT not null,
	Category_id INT not null,
	FOREIGN KEY(Category_id) REFERENCES category(Category_id) ON DELETE CASCADE 
);

CREATE TABLE review (
	Review_id INT AUTO_INCREMENT PRIMARY KEY,
	Review_date DATE not null,
	Review_text VARCHAR(100) not null,
	Review_rating INT(2) not null,
	User_id INT not null,
	Hotel_id INT not null,
	FOREIGN KEY(User_id) REFERENCES user(User_id) ON DELETE CASCADE,
	FOREIGN KEY(Hotel_id) REFERENCES hotel(Hotel_id) ON DELETE CASCADE
);


-- correct procedure and trigger

delimiter //
drop PROCEDURE IF EXISTS onNewHotel//
CREATE PROCEDURE onNewHotel()
BEGIN
   Insert into category ( Category_name, Hotel_id) values("Buisness rooms", (select max(Hotel_id) from hotel));
END//

drop procedure IF EXISTS onNewCategory//
CREATE PROCEDURE onNewCategory()
BEGIN
	INSERT into room(Room_name, Room_image, Room_length, Room_breadth, Room_price, Room_accomodates, Category_id) 
		VALUES("Classic room", "http://dq5r178u4t83b.cloudfront.net/wp-content/uploads/sites/28/2016/11/24091523/New-Luxury-Room.jpg", 50, 50, 2000, 2, (select max(Category_id) from category));
END//

drop trigger if EXISTS onNewHotelTrigger//
CREATE TRIGGER onNewHotelTrigger
AFTER INSERT ON hotel
FOR EACH ROW
BEGIN
CALL onNewHotel();
END//

drop trigger if EXISTS onNewCategoryTrigger//
CREATE TRIGGER onNewCategoryTrigger
AFTER INSERT ON category
FOR EACH ROW
BEGIN
CALL onNewCategory();
END//
delimiter ;