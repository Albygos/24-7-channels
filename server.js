const express = require('express');
const { chromium } = require('playwright');

const app = express();

const PORT = process.env.PORT || 3000;

const VIDEO_ID = 'CZ9BMzm6ccA';

let latestStatus = {
    running: false,
    lastHeartbeat: null,
    currentTime: 0
};

app.get('/', (req, res) => {

    res.send(`
        <html>
        <head>
            <title>24/7 Video Server</title>
            <style>
                body{
                    background:#000;
                    color:#0f0;
                    font-family:Arial;
                    text-align:center;
                    padding-top:50px;
                }
            </style>
        </head>
        <body>

            <h1>24/7 Video Server Active</h1>

            <p>Status: ${latestStatus.running}</p>
            <p>Heartbeat: ${latestStatus.lastHeartbeat}</p>
            <p>Current Time: ${latestStatus.currentTime}</p>

        </body>
        </html>
    `);

});

app.listen(PORT, () => {

    console.log(`Web server running on port ${PORT}`);

});

async function startPlayer() {

    while (true) {

        let browser;

        try {

            console.log('Launching Chromium...');

            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--autoplay-policy=no-user-gesture-required'
                ]
            });

            const page = await browser.newPage();

            const url =
                `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&mute=1`;

            await page.goto(url, {

                waitUntil: 'networkidle',
                timeout: 0

            });

            console.log('VIDEO RUNNING 24/7');

            while (true) {

                const status = await page.evaluate(() => {

                    const video = document.querySelector('video');

                    if (!video) {

                        return {
                            found: false
                        };

                    }

                    return {

                        found: true,
                        paused: video.paused,
                        currentTime: video.currentTime

                    };

                });

                latestStatus = {

                    running: !status.paused,
                    lastHeartbeat: new Date().toISOString(),
                    currentTime: status.currentTime

                };

                console.log('Heartbeat:', latestStatus);

                await page.waitForTimeout(60000);

            }

        } catch (err) {

            console.log('Restarting:', err.message);

            try {

                if (browser) {

                    await browser.close();

                }

            } catch (e) {}

            await new Promise(r => setTimeout(r, 5000));

        }

    }

}

startPlayer();
