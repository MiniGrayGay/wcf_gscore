// GSCore 服务器地址
const gscore_servers = [
    'ws://localhost:2536/GSUIDCore',
    // 'ws://可以添加多个ws后端地址/ws',
];





/*
 *
 * 下面开始是shit山
 *
 */


const { Wcferry } = require('@zippybee/wechatcore');
const WebSocket = require('ws');
const fs = require("fs");
const path = require("path");
let reconnectInterval = 5000;
console.log("WCF-Framework => Sayu Protocol (GScore)");
const client = new Wcferry();
client.start();
const isLogin = client.isLogin();
const userinfo = client.getUserInfo();
const wx_self_id = userinfo.u[0];
let wsClients = [];
let sigintTimer = null;
let sigintTriggered = false;

// 一些异常处理
process.on("uncaughtException", (err) => {
    if (err.code === "EBUSY") {
        console.warn("EBUSY error:", err.path);
        setTimeout(() => {
            fs.unlink(err.path, (unlinkErr) => {
                if (unlinkErr) console.warn(`EBUSY error after retry: ${unlinkErr.path}`);
                else console.log(`deleted: ${err.path}`);
            });
        }, 300000);
    } else {
        console.error("Unhandled error:", err);
    }
});

process.on('SIGINT', () => {
    if (!sigintTriggered) {
        sigintTriggered = true;
        console.log("3秒内再次按下Ctrl-C退出");
        sigintTimer = setTimeout(() => {
            sigintTriggered = false;
            console.log("操作超时");
        }, 3000);
    } else {
        clearTimeout(sigintTimer);
        process.exit();
    }
});

function connectSingleWebSocket(server) {
    const ws = new WebSocket(server);

    ws.on('open', () => {
        console.log(`WebSocket ${server} 连接成功`);
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.content[0].type === "node") {
                message.content = message.content[0].data;
            }
            message.content.forEach((item) => {
                if (item.type === "text") {
                    console.log("发送消息：" + item.data);
                    client.sendTxt(item.data, message.target_id);
                } else if (item.type === "image") {
                    let imageData = item.data;
                    if (imageData.startsWith("base64://")) {
                        const base64Data = imageData.replace("base64://", "");
                        const buffer = Buffer.from(base64Data, "base64");
                        console.log("发送消息：[图片]");
                        client.sendImage(buffer, message.target_id);
                    }
                } else {
                    console.log("未知格式：" + item.type);
                }
            });

        } catch (err) {
            console.warn('WebSocket 消息解析错误:', err);
        }
    });

    ws.on('error', (err) => {
        console.error(`WebSocket ${server} 错误:`, err);
    });

    ws.on('close', () => {
        console.log(`WebSocket ${server} 连接关闭，5秒后尝试重连...`);
        setTimeout(() => {
            reconnectWebSocket(server);
        }, reconnectInterval);
    });

    return ws;
}

function reconnectWebSocket(server) {
    const index = wsClients.findIndex(item => item.server === server);
    if (index !== -1) {
        wsClients[index].ws = connectSingleWebSocket(server);
    } else {
        wsClients.push({ server, ws: connectSingleWebSocket(server) });
    }
}

gscore_servers.forEach((server) => {
    wsClients.push({ server, ws: connectSingleWebSocket(server) });
});

const off = client.listening((msg) => {
    console.log("收到消息：" + msg.content);
    wsClients.forEach(async ({ ws, server }) => {
        if (ws.readyState === WebSocket.OPEN) {
            if (msg.content.startsWith('<?xml version="1.0"?>') || msg.content.startsWith('<msg>')) {
                downloadRes = await processMsg(msg);
                console.log(downloadRes);
                return;
            }

            ws.send(JSON.stringify(buildMessageData(msg)));
        } else {
            console.warn(`WebSocket ${server} 未连接，消息未发送`);
        }
    });
});

function buildMessageData(msg) {
    return {
        bot_self_id: wx_self_id,
        msg_id: msg.id,
        user_id: msg.sender,
        user_pm: false,
        user_type: msg.isGroup ? "group" : "direct",
        ...(msg.isGroup && { group_id: msg.roomId }),
        content: [{ type: "text", data: msg.content }],
    };
}

function getMsgType(content) {
    if (/<img\b/i.test(content)) {
        return 'image';
    } else if (/<appattach\b/i.test(content) && /<fileuploadtoken\b/i.test(content)) {
        return 'file';
    } else if (/<emoji\b/i.test(content)) {
        return 'emoji';
    } else if (/<videomsg\b/i.test(content)) {
        return 'video';
    } else if (/<location\b/i.test(content)) {
        return 'location';
    } else if (/<voicemsg\b/i.test(content)) {
        return 'voice';
    } else {
        return 'other';
    }
}

function ensureDir(dirName) {
    const fullPath = path.join(__dirname, dirName);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
}

function ensureDirectories() {
    const dirs = ['image', 'file', 'emoji', 'video', 'other', 'voice'];
    dirs.forEach(dir => ensureDir(dir));
}

async function processMsg(msg) {
    // 判断消息类型
    const msgType = getMsgType(msg.content);
    let targetDir;
    if (msgType === 'voice') {
        targetDir = 'voice';
    } else if (msgType === 'image' || msgType === 'file' || msgType === 'emoji' || msgType === 'video') {
        targetDir = msgType;
    } else {
        targetDir = 'other';
    }

    ensureDirectories();

    try {
        let downloadResult;
        if (msgType === 'voice') {
            downloadResult = await client.getAudioMsg(msg.id, targetDir);
        } else {
            downloadResult = await client.downloadImage(msg.id, targetDir);
        }
        return {
            status: 'success',
            type: msgType,
            result: downloadResult
        };
    } catch (error) {
        return {
            status: 'failure',
            type: msgType,
            result: error.toString()
        };
    }
}

function checkbqb(msg_content) {
    msg_content = msg_content.trim();
    if (msg_content.startsWith("<msg>")) {
        msg_content = msg_content.slice(5, -6).trim();
    }
    if (msg_content.startsWith("<emoji")) {
        return true;
    }
    return false;
}