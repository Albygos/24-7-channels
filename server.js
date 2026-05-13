const { chromium } = require('playwright');

const VIDEO_ID = 'CZ9BMzm6ccA';

async function startPlayer() {
    while (true) {
        try {
            console.log('Launching browser...');

            const browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--autoplay-policy=no-user-gesture-required'
                ]
            });

            const page = await browser.newPage();

            page.on('console', msg => {
                console.log('PAGE:', msg.text());
            });

            const url = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0&mute=1`;

            console.log('Opening video...');

            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 0
            });

            console.log('Video running 24/7...');

            while (true) {
                await page.waitForTimeout(60000);
                console.log('Still alive:', new Date().toISOString());
            }

        } catch (err) {
            console.error('Restarting player after error:', err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

startPlayer();
