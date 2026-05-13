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

        <title>24/7 Video Server</title>

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

    console.log('WEB SERVER RUNNING ON PORT', PORT);

});

async function startPlayer() {

    while(true){

        let browser;

        try{

            console.log('LAUNCHING BROWSER');

            browser = await chromium.launch({

                headless:true,

                args:[

                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--autoplay-policy=no-user-gesture-required',
                    '--disable-dev-shm-usage',
                    '--mute-audio'

                ]

            });

            const page = await browser.newPage({

                viewport:{
                    width:1280,
                    height:720
                }

            });

            const url =
                `https://www.youtube.com/watch?v=${VIDEO_ID}`;

            console.log('OPENING YOUTUBE');

            await page.goto(url,{

                waitUntil:'domcontentloaded',
                timeout:0

            });

            console.log('WAITING PAGE');

            await page.waitForTimeout(10000);

            console.log('WAITING FOR VIDEO ELEMENT');

            await page.waitForFunction(() => {

                return document.querySelector('video');

            }, {

                timeout:60000

            });

            console.log('VIDEO ELEMENT FOUND');

            await page.evaluate(() => {

                const v = document.querySelector('video');

                if(v){

                    v.muted = true;

                    v.play();

                }

            });

            console.log('PLAY STARTED');

            while(true){

                const status = await page.evaluate(() => {

                    const v = document.querySelector('video');

                    if(!v){

                        return {

                            running:false,
                            currentTime:0,
                            readyState:0,
                            duration:0

                        };

                    }

                    return {

                        running:!v.paused,
                        currentTime:v.currentTime || 0,
                        readyState:v.readyState || 0,
                        duration:v.duration || 0

                    };

                });

                latestStatus = {

                    running:status.running,
                    heartbeat:new Date().toISOString(),
                    currentTime:status.currentTime,
                    readyState:status.readyState,
                    duration:status.duration

                };

                console.log('HEARTBEAT');
                console.log(latestStatus);

                await page.screenshot({

                    path:'live-proof.png'

                });

                if(!status.running){

                    console.log('VIDEO PAUSED -> REPLAY');

                    await page.evaluate(() => {

                        const v = document.querySelector('video');

                        if(v){

                            v.play();

                        }

                    });

                }

                await page.waitForTimeout(10000);

            }

        }catch(err){

            console.log('ERROR');
            console.log(err.message);

            try{

                if(browser){

                    await browser.close();

                }

            }catch(e){}

            console.log('RESTARTING IN 5 SEC');

            await new Promise(r=>setTimeout(r,5000));

        }

    }

}

startPlayer();
