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

// Format time remaining for display
function formatTimeRemaining(remainingSeconds, totalMinutes) {
    if (!remainingSeconds && remainingSeconds !== 0) return null;

    const absRemaining = Math.abs(remainingSeconds);
    const mins = Math.floor(absRemaining / 60);
    const secs = absRemaining % 60;
    const isOvertime = remainingSeconds < 0;

    // Format current time
    let timeStr = '';
    if (mins > 0) {
        timeStr = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
        timeStr = `${secs}s`;
    }

    // If we have total time, show "X of Y remaining"
    if (totalMinutes && totalMinutes > 0) {
        const totalStr = `${totalMinutes}m`;
        if (isOvertime) {
            return `+${timeStr} over ${totalStr}`;
        }
        return `${timeStr} of ${totalStr} remaining`;
    }

    // For count-up tasks, just show elapsed time
    return `${timeStr} elapsed`;
}

// Set Discord presence activity
function setActivity(data) {
    if (!rpcClient || !isConnected) {
        currentActivity = data; // Store for when we connect
        return;
    }

    const startTimestamp = data.startTimestamp || (data.endTimestamp ? undefined : Date.now());
    const endTimestamp = data.endTimestamp;

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
        case 'Compact':
            if (data.taskName) {
                // Truncate task name for details line
                details = data.taskName.length > 32 ? data.taskName.slice(0, 32) : data.taskName;
            } else {
                details = 'Compact Mode';
            }

            // Format state with time remaining
            if (data.timerActive && data.timerRemaining !== undefined) {
                const timeInfo = formatTimeRemaining(data.timerRemaining, data.estimatedTimeMinutes);
                state = timeInfo || '⏱️ Focus Timer Active';
            } else if (data.timerActive) {
                state = '⏱️ Focus Timer Active';
            } else {
                state = '⏸️ Timer Paused';
            }

            smallImageKey = 'focus_icon';
            smallImageText = 'Compact View';
            break;
        case 'Focus':
            if (data.isSuperFocus) {
                details = '🔥 SUPER FOCUS MODE';
                // Include task name and time for super focus
                if (data.taskName && data.timerRemaining !== undefined && data.timerActive) {
                    const timeInfo = formatTimeRemaining(data.timerRemaining, data.estimatedTimeMinutes);
                    state = timeInfo ? `${data.taskName.slice(0, 20)} • ${timeInfo}` : data.taskName.slice(0, 30);
                } else if (data.taskName) {
                    state = data.taskName.slice(0, 30);
                } else {
                    state = 'Deep work session';
                }
                smallImageKey = 'focus_icon';
                smallImageText = 'Super Focus Active';
            } else if (data.timerActive) {
                // Show task name as details
                if (data.taskName) {
                    details = data.taskName.length > 32 ? data.taskName.slice(0, 32) : data.taskName;
                } else {
                    details = '⏱️ Focus Session';
                }
                // Show time info in state
                if (data.timerRemaining !== undefined) {
                    const timeInfo = formatTimeRemaining(data.timerRemaining, data.estimatedTimeMinutes);
                    state = timeInfo || 'Staying focused';
                } else {
                    state = 'Staying focused';
                }
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
        case 'Journal':
            details = '📓 Writing Journal';
            state = data.topicName ? `Topic: ${data.topicName}` : 'Reflecting';
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
        endTimestamp,
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
