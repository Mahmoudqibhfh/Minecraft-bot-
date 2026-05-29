const mineflayer = require('mineflayer');
const fs = require('fs');

// =================== قراءة الإعدادات الأساسية ===================
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

// =================== إعدادات البوتات المتعددة ===================
const BOT_COUNT = 2;                    // عدد البوتات اللي تدخل مع بعض
const MIN_STAY_HOURS = 1;               // أقل مدة: ساعة
const MAX_STAY_HOURS = 3;               // أقصى مدة: 3 ساعات
const RECONNECT_DELAY_SECONDS = 3;      // تأخير إعادة الدخول بعد الخروج (ثواني)

// =================== توليد أسماء عشوائية ===================
const usedNames = new Set();

function generateRandomName() {
    const prefixes = ['Blue', 'Red', 'Dark', 'Light', 'Fast', 'Smart', 'Wild'];
    const suffixes = ['Wolf', 'Fox', 'Tiger', 'Hawk', 'Dragon'];
    
    while (true) {
        const name = prefixes[Math.floor(Math.random() * prefixes.length)] +
                     suffixes[Math.floor(Math.random() * suffixes.length)] +
                     Math.floor(Math.random() * 1000);
        
        if (!usedNames.has(name)) {
            usedNames.add(name);
            return name;
        }
    }
}

// =================== دوال الحركة (نفس كودك الأصلي) ===================
function setupMovement(bot) {
    let lasttime = -1;
    let moving = 0;
    let lastaction;
    const actions = ['forward', 'back', 'left', 'right'];
    const pi = 3.14159;
    const moveinterval = 2;
    const maxrandom = 5;
    let connected = 0;

    bot.on('login', function() {
        console.log(`[${bot.username}] Logged In`);
    });

    bot.on('time', function() {
        if (connected < 1) return;
        
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

    bot.on('spawn', function() {
        connected = 1;
        console.log(`[${bot.username}] Spawned in world`);
        
        // حساب مدة البقاء العشوائية (من 1 إلى 3 ساعات)
        const stayMs = (MIN_STAY_HOURS + Math.random() * (MAX_STAY_HOURS - MIN_STAY_HOURS)) * 60 * 60 * 1000;
        const stayHours = (stayMs / (60 * 60 * 1000)).toFixed(1);
        console.log(`[${bot.username}] سيبقى لمدة ${stayHours} ساعة`);
        
        // جدولة الخروج بعد المدة العشوائية
        setTimeout(() => {
            console.log(`[${bot.username}] حان وقت الخروج بعد ${stayHours} ساعة`);
            bot.end();
        }, stayMs);
    });
}

// =================== إنشاء بوت واحد ===================
function createBot(botIndex, customName = null) {
    const botName = customName || generateRandomName();
    console.log(`[${botIndex}] 🤖 جاري تشغيل البوت باسم: ${botName}`);

    const bot = mineflayer.createBot({
        host: data["ip"],
        port: data["port"],
        username: botName,
        version: data["version"] || false
    });

    // تفعيل نظام الحركة
    setupMovement(bot);

    // معالجة الأخطاء
    bot.on('error', (err) => {
        console.error(`[${botName}] خطأ: ${err.message}`);
    });

    // عند الخروج، يعيد الدخول باسم جديد
    bot.on('end', (reason) => {
        console.log(`[${botName}] خرج من السيرفر. السبب: ${reason || 'انتهت المدة'}`);
        
        setTimeout(() => {
            const newName = generateRandomName();
            console.log(`[${botIndex}] 🔄 إعادة تشغيل باسم جديد: ${newName}`);
            createBot(botIndex, newName);
        }, RECONNECT_DELAY_SECONDS * 1000);
    });

    bot.on('kick', (reason) => {
        console.log(`[${botName}] تم طرده: ${reason}`);
        setTimeout(() => {
            const newName = generateRandomName();
            createBot(botIndex, newName);
        }, 5000);
    });

    return bot;
}

// =================== تشغيل البوتات ===================
console.log(`\n🚀 بدء تشغيل ${BOT_COUNT} بوت مع بعض\n`);

for (let i = 0; i < BOT_COUNT; i++) {
    // يدخل البوتان مع بعض مع تأخير نصف ثانية فقط
    setTimeout(() => createBot(i + 1), i * 500);
			}
