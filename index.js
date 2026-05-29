const mineflayer = require('mineflayer');
const fs = require('fs');

// قراءة الإعدادات
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

// متغيرات الحركة
var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = ['forward', 'back', 'left', 'right'];
var lastaction;
var pi = 3.14159;
var moveinterval = 2;
var maxrandom = 5;
var host = data["ip"];
var port = data["port"];
var username = data["name"];

// دالة إنشاء البوت
function createBotInstance() {
    return mineflayer.createBot({
        host: host,
        port: port,
        username: username
    });
}

var bot = createBotInstance();

// ========== إعادة المحاولة التلقائية (المطلوبة) ==========
function reconnectBot() {
    console.log(`⏳ السيرفر غير متاح، إعادة محاولة بعد 10 ثواني...`);
    setTimeout(() => {
        console.log(`🔄 جاري إعادة الاتصال بـ ${host}:${port}`);
        bot = createBotInstance();
        rebindEvents();
    }, 10000);
}

function rebindEvents() {
    bot.on('login', function() {
        console.log("✅ تم تسجيل الدخول");
    });
    
    bot.on('spawn', function() {
        connected = 1;
        console.log("✅ تم الدخول إلى السيرفر بنجاح!");
    });
    
    bot.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log(`❌ السيرفر طافي (${host}:${port})`);
            reconnectBot();
        } else {
            console.log(`❌ خطأ: ${err.message}`);
        }
    });
    
    bot.on('end', () => {
        console.log("🔌 انقطع الاتصال، جاري إعادة المحاولة...");
        reconnectBot();
    });
}

// تفعيل إعادة المحاولة
rebindEvents();

// ========== كود الحركة الأصلي ==========
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

bot.on('time', function() {
    if (connected < 1) {
        return;
    }
    if (lasttime < 0) {
        lasttime = bot.time.age;
    } else {
        var randomadd = Math.random() * maxrandom * 20;
        var interval = moveinterval * 20 + randomadd;
        if (bot.time.age - lasttime > interval) {
            if (moving == 1) {
                bot.setControlState(lastaction, false);
                moving = 0;
                lasttime = bot.time.age;
            } else {
                var yaw = Math.random() * pi - (0.5 * pi);
                var pitch = Math.random() * pi - (0.5 * pi);
                bot.look(yaw, pitch, false);
                lastaction = actions[Math.floor(Math.random() * actions.length)];
                bot.setControlState(lastaction, true);
                moving = 1;
                lasttime = bot.time.age;
                bot.activateItem();
            }
        }
    }
});
