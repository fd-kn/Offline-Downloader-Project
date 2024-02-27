const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Webpage = require('./webpage');
const path = require('path')
require('dotenv').config();


const dbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@offline-downloader.fxxvtpy.mongodb.net/offline-webpages?retryWrites=true&w=majority`;
mongoose.connect(dbURI)
    .then((result) => app.listen(3001, () => {
        console.log("running on port 3001")}))
    .catch((err) => console.log(err));

let browserInstance; // Global variable to store the Puppeteer browser instance


async function getBrowserInstance() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch();
    }
    return browserInstance;
}

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
    try {
        // Fetch all webpages from the database
        const allWebpages = await Webpage.find({});
        // Render the home page and pass the webpage titles with URLs
        res.render('home', { allWebpages });
    } catch (error) {
        console.error('Error retrieving webpages:', error);
        res.status(500).render('error', { errorMessage: 'Error retrieving webpages' }); 
    }
});


app.get('/main.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript'); // Set the correct MIME type
    res.sendFile(path.join(__dirname, 'main.js')); // Serve the main.js file from the root directory
  });

  app.get('/index.js', (req, res) => {
    // Set the correct MIME type
    res.setHeader('Content-Type', 'application/javascript');
    // Serve the index.js file from the root directory
    res.sendFile(path.join(__dirname, 'index.js'));
});

  app.get('/cached_pages.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript'); // Set the correct MIME type
    res.sendFile(path.join(__dirname, 'cached_pages.js')); // Serve the main.js file from the root directory
  });

  app.get('/public/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css'); // Set the correct MIME type for CSS
    res.sendFile(path.join(__dirname, 'public', 'styles.css')); // Serve the CSS file
});

app.get('/views/home.ejs', (req, res) => {
    res.setHeader('Content-Type', 'text/html'); // Set the Content-Type header
    res.sendFile(path.join(__dirname, 'views', 'home.ejs')); // 
});

app.get('/views/error.ejs', (req, res) => {
    res.setHeader('Content-Type', 'text/html'); // Set the Content-Type header
    res.sendFile(path.join(__dirname, 'views', 'error.ejs')); // Serve the CSS file
});


app.post("/submit", async (req, res) => {
    const webpageLink = req.body.webpageLink;
    console.log('Submitted webpage link:', webpageLink);
    console.log(req.body);

    try {
        // Get the Puppeteer browser instance
        const browser = await getBrowserInstance();
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);

        // Navigate to the specified webpage
        await page.goto(webpageLink, { waitUntil: 'domcontentloaded' }); // Wait for DOM content to be loaded

        // Extract HTML content from the webpage using Puppeteer
        const htmlContent = await page.content();
        console.log('Webpage content without JavaScript:', htmlContent);

        const title = await page.title();


        const newWebpage = new Webpage({
            url: webpageLink,
            htmlContent: htmlContent,
            title: title
        });
        
        newWebpage.save()
            .then(savedWebpage => {
                console.log('Webpage saved successfully:', savedWebpage);
            })
            .catch(error => {
                console.error('Error saving webpage:', error);
            });


        res.send(newWebpage.htmlContent);

        // Close the page
        await page.close();
    } catch (error) {
        console.error('Error during web scraping:', error);
        res.render('error', { errorMessage: 'Error during web scraping' }); 
    }
});


app.get("/webpage/:title", async (req, res) => {
    const title = req.params.title;
    try {
        // Find the webpage with the specified title in the database
        const webpage = await Webpage.findOne({ title: title });
        if (!webpage) {
            // If the webpage is not found, render an error page
            return res.status(404).render('error', { errorMessage: 'Webpage not found' });
        }
        // Render the webpage content to the home page
        res.send(webpage.htmlContent);
    } catch (error) {
        console.error('Error retrieving webpage:', error);
        res.status(500).render('error', { errorMessage: 'Error retrieving webpage' }); 
    }
});



app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).render('error', { errorMessage: 'Something went wrong!' }); 
    })


