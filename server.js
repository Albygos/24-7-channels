const { chromium } = require('playwright');

const VIDEO_ID = 'CZ9BMzm6ccA';

async function startPlayer() {

    while (true) {

        let browser;

        try {

            console.log('====================================');
            console.log('Launching Chromium Browser...');
            console.log('====================================');

            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--autoplay-policy=no-user-gesture-required',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer'
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
                `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&mute=1&controls=1`;

            console.log('Opening YouTube Video...');
            console.log(videoURL);

            await page.goto(videoURL, {

                waitUntil: 'networkidle',
                timeout: 0

            });

            console.log('====================================');
            console.log('VIDEO IS RUNNING 24/7');
            console.log('====================================');

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
                        currentTime: video.currentTime,
                        duration: video.duration

                    };

                });

                console.log('------------------------------------');
                console.log('Heartbeat:', new Date().toISOString());
                console.log(status);
                console.log('------------------------------------');

                if (!status.found) {

                    throw new Error('Video element not found');

                }

                if (status.paused) {

                    console.log('Video paused. Attempting replay...');

                    await page.evaluate(() => {

                        const video = document.querySelector('video');

                        if (video) {

                            video.play();

                        }

                    });

                }

                await page.screenshot({

                    path: 'live-proof.png'

                });

                console.log('Screenshot updated: live-proof.png');

                await page.waitForTimeout(60000);

            }

        } catch (err) {

            console.log('====================================');
            console.log('ERROR OCCURRED');
            console.log(err.message);
            console.log('Restarting in 5 seconds...');
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
