//configure the env package
require('dotenv').config();

const express = require('express')
const cookieParser = require("cookie-parser")
const path = require('path')
const app = express()
const userroute = require('./routes/user')
const { connecttoserver } = require("./services/mongodbconnect")
const { queryhandler } = require("./middlewares/querymiddleware")
const { checkforauthentication } = require("./middlewares/auth")
const port = process.env.PORT || 3000

//connection of mongodb
connecttoserver()

// ADD THESE MIDDLEWARES 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve("./public")))
app.use(cookieParser())
app.use(queryhandler())

//sending payload to the pages
app.use(checkforauthentication("token"));

//setting the view engine
app.set('trust proxy', 1);
app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))


//route for home page
app.get('/', (req, res) => {
  // Check if user is authenticated
  if (req.user && req.user.farmArea) {
    // User is logged in - calculate yield trend
    const farmArea = req.user.farmArea;
    const baseYield = farmArea * 2.5;
    const randomVariation = (Math.random() * 10 - 5).toFixed(1);

    let trendStatus, trendColor, trendIcon;

    if (randomVariation > 3) {
      trendStatus = "Growing Steady";
      trendColor = "green";
      trendIcon = "fa-arrow-trend-up";
    } else if (randomVariation > 0) {
      trendStatus = "Slight Growth";
      trendColor = "emerald";
      trendIcon = "fa-arrow-up";
    } else if (randomVariation > -3) {
      trendStatus = "Stable";
      trendColor = "yellow";
      trendIcon = "fa-minus";
    } else {
      trendStatus = "Needs Attention";
      trendColor = "red";
      trendIcon = "fa-arrow-trend-down";
    }

    res.render("home", {
      user: req.user,
      yieldTrend: randomVariation > 0 ? `+${randomVariation}%` : `${randomVariation}%`,
      trendStatus: trendStatus,
      trendColor: trendColor,
      trendIcon: trendIcon
    });
  } else {
    // User is NOT logged in - render home without yield data
    res.render("home", {
      user: req.user,
      yieldTrend: null,
      trendStatus: null,
      trendColor: null,
      trendIcon: null
    });
  }
});

//route for about page
app.get('/about', (req, res) => {
  res.render("about", { user: req.user })
})

//route for contact page
app.get('/contact', (req, res) => {
  res.render("contact", { user: req.user })
})


//managing the routes 
app.use("/user", userroute)

app.listen(port, () => {
  console.log(`Server running on port:${port}`)
})