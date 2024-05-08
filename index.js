    const express = require("express");
    const app = express();
    const bodyParser = require("body-parser");
    const puppeteer = require('puppeteer');
    const mongoose = require('mongoose');
    const Webpage = require('./webpage');
    const path = require('path')
    require('dotenv').config();


    const dbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@offline-downloader.fxxvtpy.mongodb.net/`
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('view engine', 'ejs');

    //! SERVING FILES

    app.get('/main.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript'); 
        res.sendFile(path.join(__dirname, 'main.js')); 
    });

    app.get('/index.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(__dirname, 'index.js'));
    });

    app.get('/cached_pages.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript'); 
        res.sendFile(path.join(__dirname, 'cached_pages.js')); 
    });

    app.get('/public/styles.css', (req, res) => {
        res.setHeader('Content-Type', 'text/css'); 
        res.sendFile(path.join(__dirname, 'public', 'styles.css')); 
    });

    app.get('/views/home.ejs', (req, res) => {
        res.setHeader('Content-Type', 'text/html'); 
        res.sendFile(path.join(__dirname, 'views', 'home.ejs')); 
    });

    app.get('/views/error.ejs', (req, res) => {
        res.setHeader('Content-Type', 'text/html'); 
        res.sendFile(path.join(__dirname, 'views', 'error.ejs')); 
    });



    let browserInstance; 
    
    
    async function getBrowserInstance() {
        if (!browserInstance) {
            browserInstance = await puppeteer.launch();
        }
        return browserInstance;
    }



    //! Connecting to MongoDB
    async function connectToMongoDB() {
        try {
            await mongoose.connect(dbURI, { connectTimeoutMS: 3000 }); 
            console.log('Connected to MongoDB');
            return true; 
        } catch (error) {
            console.error('Error connecting to MongoDB from connectToMongoDB():', error);
            return false; 
        }
    }
    
//! Hourly check for updates

const cron = require('node-cron');

cron.schedule('0 * * * *', async () => {

    try {
        const allWebpages = await Webpage.find({});

        for (const webpage of allWebpages) {
            try {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.setJavaScriptEnabled(true);
    
                await page.goto(webpage.url, { waitUntil: 'domcontentloaded' });
    
                const htmlContent = await page.content();
    
                if (webpage.htmlContent !== htmlContent) {
                    await Webpage.updateOne({ _id: webpage._id }, { htmlContent });
                    console.log(`HTML content updated for ${webpage.title}`);
                }
    
                await browser.close();
            } catch (error) {
                console.error(`Error fetching HTML content for ${webpage.title}:`, error);
            }
        }
    } catch (error) {
        console.error('Error fetching webpages:', error);
    }
});




//! ROUTES
    
    app.get("/", async (req, res) => {

        const isConnected = await connectToMongoDB();
    
        try {        
            let allWebpages = '';
            console.log('isConnected: ', isConnected )

            if (isConnected) {
                const timeoutPromise = new Promise(resolve => {
                    setTimeout(() => {
                        resolve(null); 
                    }, 3000);
                });
    
                const raceResult = await Promise.race([
                    Webpage.find({}),
                    timeoutPromise
                ]);

                if (raceResult) {
                    allWebpages = raceResult;
                }
            } else {
                allWebpages = '';
            }
            res.render('home', { allWebpages });
 
        } catch (error) {
            console.error('Error retrieving webpages:', error);
            const allWebpages = ''
            res.render('home', {allWebpages});
            
        }
    });


    app.post("/submit", async (req, res) => {

        const webpageLink = req.body.webpageLink;
        console.log('Submitted webpage link:', webpageLink);
        const validUrlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

        if(webpageLink === '' || !validUrlRegex.test(webpageLink)){ 
            return res.redirect('/'); 
        } else {
        try {
            const existingWebpage = await Webpage.findOne({ url: webpageLink });
            if (existingWebpage) {
                console.log('Webpage with URL already exists');
                return res.redirect('/');

            } else {
                const browser = await getBrowserInstance();
                const page = await browser.newPage();
                await page.setJavaScriptEnabled(true);

                console.log('second check')

                await page.goto(webpageLink, { waitUntil: 'domcontentloaded' }); // Wait for DOM content to be loaded
                const htmlContent = await page.content();
                const title = await page.title();
    
                const newWebpage = new Webpage({
                    url: webpageLink,
                    htmlContent: htmlContent,
                    title: title
                });

                
                newWebpage.save()
                    .then(savedWebpage => {
                        console.log('Webpage saved successfully');
                        return Webpage.find({});

                    })
                    .then(allWebpages => {
                        res.redirect('/');
                    })
                    .catch(error => {
                        console.error('Error saving webpage:', error);
                        res.status(500).render('error', { errorMessage: 'Error saving webpage' });
                    });
    
                await page.close();                            
    }

        } catch (error) {
            console.error('Error during web scraping from the submit route', error);
            res.redirect('/');
        }}
    });
    

    app.get("/webpage/:title", async (req, res) => {
        const title = req.params.title;
        try {
            const webpage = await Webpage.findOne({ title: title });
            if (!webpage) {
                return res.status(404).render('error', { errorMessage: 'Webpage not found' });
            }
            res.send(webpage.htmlContent);
        } catch (error) {
            console.error('Error retrieving webpage:', error);
            res.status(500).render('error', { errorMessage: 'Error retrieving webpage' }); 
        }
    });




    app.post("/delete-webpage", async (req, res) => {
        const title = req.body.title;
        try {
            const deletedWebpage = await Webpage.findOneAndDelete({ title: title });
            if (deletedWebpage) {
                console.log('Webpage deleted successfully:', deletedWebpage);
                res.redirect('/');
            } else {
                console.log('Webpage not found');
                res.redirect('/');
            }
        } catch (error) {
            console.error('Error deleting webpage:', error);
            res.status(500).render('error', { errorMessage: 'Error deleting webpage' });
        }
    });



    app.get("/allwebpages", async (req, res) => {
        try {
            const fetchPromise = Webpage.find({});
            const timeout = 5000; 
    
            const allWebpages = await Promise.race([
                fetchPromise,
                new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), timeout);
                })
            ]);
    
            res.json(allWebpages);
        } catch (error) {
            console.error('Error fetching webpages:', error);
            res.redirect('/');
        }
    });
    


    app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).render('error', { errorMessage: 'Something went wrong!' }); 
        })


    app.listen(process.env.PORT || 3001, () => {
        console.log(`running on port 3001`)})