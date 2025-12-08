// electron/discordRPC.cjs
// Discord Rich Presence integration for Lumen

const RPC = require('discord-rpc');

const CLIENT_ID = '1447559004698968135';
let rpcClient = null;
let isConnected = false;
let currentActivity = null;

// Initialize Discord RPC
async function initDiscordRPC() {
    if (rpcClient) return;

    rpcClient = new RPC.Client({ transport: 'ipc' });

    rpcClient.on('ready', () => {
        console.log('✅ Discord RPC Connected as', rpcClient.user.username);
        isConnected = true;

        // Set initial presence
        if (currentActivity) {
            setActivity(currentActivity);
        } else {
            setActivity({
                page: 'Dashboard',
                status: 'idle'
            });
        }
    });

    rpcClient.on('disconnected', () => {
        console.log('⚠️ Discord RPC Disconnected');
        isConnected = false;
    });

    try {
        await rpcClient.login({ clientId: CLIENT_ID });
    } catch (error) {
        console.log('❌ Discord RPC failed to connect:', error.message);
        // Discord not running or app not registered - this is fine
        rpcClient = null;
        isConnected = false;
    }
}

// Set Discord presence activity
function setActivity(data) {
    if (!rpcClient || !isConnected) {
        currentActivity = data; // Store for when we connect
        return;
    }

    const startTimestamp = data.startTimestamp || Date.now();

    let details = 'Viewing Dashboard';
    let state = 'Idle';
    let largeImageKey = 'lumen_logo';
    let largeImageText = 'Lumen - AI Productivity';
    let smallImageKey = null;
    let smallImageText = null;
    let buttons = null;

    // Determine presence based on page and status
    switch (data.page) {
        case 'Dashboard':
            details = '📊 Viewing Dashboard';
            state = 'Planning the day';
            break;
        case 'Tasks':
            details = '✅ Managing Tasks';
            state = data.taskCount ? `${data.taskCount} tasks` : 'Organizing';
            break;
        case 'Goals':
            details = '🎯 Setting Goals';
            state = 'Building ambitions';
            break;
        case 'Habits':
            details = '🔄 Tracking Habits';
            state = 'Building consistency';
            break;
        case 'Calendar':
            details = '📅 Calendar View';
            state = 'Planning ahead';
            break;
        case 'Focus':
            if (data.isSuperFocus) {
                details = '🔥 SUPER FOCUS MODE';
                state = data.taskName ? `Working on: ${data.taskName.slice(0, 30)}` : 'Deep work session';
                smallImageKey = 'focus_icon';
                smallImageText = 'Super Focus Active';
            } else if (data.timerActive) {
                details = '⏱️ Focus Session';
                state = data.taskName ? `Focusing: ${data.taskName.slice(0, 30)}` : 'Staying focused';
                smallImageKey = 'focus_icon';
                smallImageText = 'Timer Running';
            } else {
                details = '🧘 Focus Page';
                state = 'Preparing to focus';
            }

            // Add Join Study Session button when in an active session
            if (data.sessionCode) {
                buttons = [
                    {
                        label: '📚 Join Study Session',
                        url: `https://lumen.study/join/${data.sessionCode}`
                    }
                ];
            } else if (data.timerActive || data.isSuperFocus) {
                // Show invite button even without a session code (will prompt user to create one)
                buttons = [
                    {
                        label: '📚 Join Study Session',
                        url: `https://lumen.study/invite`
                    }
                ];
            }
            break;
        case 'Messages':
            details = '💬 Messaging';
            state = 'Connecting with friends';
            break;
        case 'Settings':
            details = '⚙️ Configuring';
            state = 'Customizing experience';
            break;
        default:
            details = '✨ Using Lumen';
            state = 'Being productive';
    }

    const activity = {
        details,
        state,
        startTimestamp,
        largeImageKey,
        largeImageText,
        instance: false,
    };

    if (smallImageKey) {
        activity.smallImageKey = smallImageKey;
        activity.smallImageText = smallImageText;
    }

    // Add buttons for Join Study Session
    if (buttons) {
        activity.buttons = buttons;
    }

    try {
        rpcClient.setActivity(activity);
        currentActivity = data;
    } catch (error) {
        console.error('Failed to set Discord activity:', error);
    }
}

// Destroy RPC connection
function destroyRPC() {
    if (rpcClient) {
        rpcClient.destroy();
        rpcClient = null;
        isConnected = false;
    }
}

module.exports = {
    initDiscordRPC,
    setActivity,
    destroyRPC
};
