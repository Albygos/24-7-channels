const express = require('express');
const { chromium } = require('playwright');

const app = express();

const PORT = process.env.PORT || 3000;

const VIDEO_ID = 'CZ9BMzm6ccA';

let latestStatus = {
    running: false,
    heartbeat: '',
    currentTime: 0,
    readyState: 0,
    duration: 0
};

app.get('/', (req, res) => {

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>

        <title>24/7 YouTube Server</title>

        <meta http-equiv="refresh" content="5">

        <style>

            body{
                margin:0;
                background:#000;
                color:#00ff66;
                font-family:Arial;
                text-align:center;
                padding-top:60px;
            }

            h1{
                font-size:40px;
            }

            .box{
                margin-top:30px;
                font-size:22px;
                line-height:2;
            }

            .live{
                width:15px;
                height:15px;
                background:#00ff66;
                border-radius:50%;
                display:inline-block;
                animation:pulse 1s infinite;
                margin-right:10px;
            }

            @keyframes pulse{
                0%{transform:scale(1);}
                50%{transform:scale(1.5);}
                100%{transform:scale(1);}
            }

        </style>

    </head>

    <body>

        <h1>
            <span class="live"></span>
            24/7 Video Server Active
        </h1>

        <div class="box">

            <div>Status: ${latestStatus.running}</div>

            <div>Heartbeat: ${latestStatus.heartbeat}</div>

            <div>Current Time: ${latestStatus.currentTime}</div>

            <div>Ready State: ${latestStatus.readyState}</div>

            <div>Duration: ${latestStatus.duration}</div>

        </div>

    </body>
    </html>
    `);

});

app.listen(PORT, () => {

    console.log('====================================');
    console.log(`WEB SERVER RUNNING ON PORT ${PORT}`);
    console.log('====================================');

});

async function startPlayer() {

    while (true) {

        let browser;

        try {

            console.log('====================================');
            console.log('LAUNCHING CHROMIUM');
            console.log('====================================');

            browser = await chromium.launch({

                headless: true,

                args: [

                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--autoplay-policy=no-user-gesture-required',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--mute-audio'

                ]

            });

            const page = await browser.newPage({

                viewport: {

                    width: 1280,
                    height: 720

                }

            });

            page.on('console', msg => {

                console.log('[PAGE]', msg.text());

            });

            const videoURL =
                `https://www.youtube.com/watch?v=${VIDEO_ID}`;

            console.log('OPENING YOUTUBE VIDEO...');
            console.log(videoURL);

            await page.goto(videoURL, {

                waitUntil: 'domcontentloaded',
                timeout: 0

            });

            console.log('WAITING FOR PAGE LOAD...');
            await page.waitForTimeout(8000);

            console.log('TRYING PLAY BUTTON CLICK...');

            try {

                await page.click('button[aria-label*="Play"]');

            } catch (e) {

                console.log('PLAY BUTTON CLICK FAILED');

            }

            await page.waitForTimeout(3000);

            console.log('TRYING KEYBOARD PLAY...');
            await page.keyboard.press('k');

            await page.waitForTimeout(3000);

            console.log('FORCE PLAYING VIDEO...');

            await page.evaluate(() => {

                const vid = document.querySelector('video');

                if (vid) {

                    vid.muted = true;

                    vid.play()
                        .then(() => {

                            console.log('VIDEO PLAY STARTED');

                        })
                        .catch(err => {

                            console.log(err);

                        });

                }

            });

            console.log('====================================');
            console.log('24/7 VIDEO LOOP STARTED');
            console.log('====================================');

            while (true) {

                const status = await page.evaluate(() => {

                    const video = document.querySelector('video');

                    if (!video) {

                        return {

                            found:false

                        };

                    }

                    return {

                        found:true,
                        paused:video.paused,
                        currentTime:video.currentTime,
                        readyState:video.readyState,
                        duration:video.duration

                    };

                });

                latestStatus = {

                    running: !status.paused,
                    heartbeat: new Date().toISOString(),
                    currentTime: status.currentTime,
                    readyState: status.readyState,
                    duration: status.duration

                };

                console.log('------------------------------------');
                console.log('HEARTBEAT');
                console.log(latestStatus);
                console.log('------------------------------------');

                await page.screenshot({

                    path:'live-proof.png'

                });

                console.log('SCREENSHOT UPDATED');

                if (status.paused) {

                    console.log('VIDEO PAUSED -> REPLAYING');

                    await page.evaluate(() => {

                        const vid = document.querySelector('video');

                        if (vid) {

                            vid.play();

                        }

                    });

                }

                await page.waitForTimeout(10000);

            }

        } catch (err) {

            console.log('====================================');
            console.log('ERROR OCCURRED');
            console.log(err.message);
            console.log('RESTARTING IN 5 SECONDS...');
            console.log('====================================');

            try {

                if (browser) {

                    await browser.close();

                }

            } catch (e) {}

            await new Promise(resolve => setTimeout(resolve, 5000));

        }

    }

}

startPlayer();
