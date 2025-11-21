COMPLETE IMPLEMENTATION CODE FOR studyBuddyService.ts

1. SYSTEM PROMPT UPDATE (Replace lines 130-139):

const SYSTEM_PROMPT = `You are Aze, a friendly and encouraging study buddy AI assistant built into the Zenith productivity app.

**You can:**
- Tasks: Create, edit, delete, start, pause, complete
- Calendar: Create events
- Messaging: Send messages to users
- Breaks: Schedule breaks
- Music: Search and play Spotify music 🎵
- Navigation: Switch pages
- Status: Update user status

**Be proactive** - when users ask you to do something, DO IT with your tools! Keep responses 2-3 sentences max. Suggest focus music and breaks for productivity.`;

2. TOOL IMPLEMENTATIONS (Add before "default:" case at line 206):

            case "editTask":
                const task = appStore.tasks.find(t => t.id === args.taskId);
                if (!task) return "Task not found.";
                const updates: any = {};
                if (args.title) updates.title = args.title;
                if (args.description !== undefined) updates.description = args.description;
                if (args.status) updates.status = TaskStatus[args.status];
                if (args.priority) updates.priority = TaskPriority[args.priority];
                appStore.updateTask(args.taskId, updates);
                return "Task updated.";

            case "deleteTask":
                appStore.delete Task(args.taskId);
                return "Task deleted.";

            case "getTasks":
                const tasks = appStore.tasks;
                if (tasks.length === 0) return "No tasks.";
                return `Tasks:\n${tasks.map(t => `[ID:${t.id}] ${t.title} - ${t.status}`).join('\n')}`;

            case "createCalendarEvent":
                useCalendarStore.getState().addEvent({
                    id: Date.now(),
                    title: args.title,
                    start: new Date(args.start),
                    end: new Date(args.end),
                    category: args.category,
                    reminder: args.reminder,
                    notified: false
                });
                return `Event "${args.title}" created.`;

            case "sendMessage":
                if (!messageStore.currentUser) return "Not logged in.";
                const recip = messageStore.users.find(u => u.username.toLowerCase() === args.username.toLowerCase());
                if (!recip) return "User not found.";
                await messageStore.sendMessage(recip.id, args.message);
                return `Message sent.`;

            case "scheduleBreak":
                appStore.addTask({
                    id: Date.now(),
                    title: `Break (${args.duration}min)`,
                    status: TaskStatus.TODO,
                    priority: TaskPriority.LOW,
                    category: "Break",
                    duration: `${args.duration}min`,
                    isCompleted: false
                } as any);
                return `${args.duration}min break scheduled.`;

            case "searchSpotifyTrack":
                const spotStore = useSpotifyStore.getState();
                const tok = await spotStore.ensureSpotifyAccessToken();
                if (!tok) return "Spotify not connected.";
                const sRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(args.query)}&type=${args.type||"track"}&limit=${args.limit||5}`, {headers: { Authorization: `Bearer ${tok}` }});
                const sData = await sRes.json();
                const its = sData[`${args.type||"track"}s`]?.items || [];
                if (!its.length) return "No results.";
                return `Found:\n${its.map((i: any, n: number) => `${n+1}. ${i.name}${i.artists?' by '+i.artists[0].name:''}`).join('\n')}`;

            case "playSpotifyTrack":
                const tok2 = await useSpotifyStore.getState().ensureSpotifyAccessToken();
                if (!tok2) return "Spotify not connected.";
                let uri = args.uri;
                if (!uri.startsWith("spotify:")) {
                    const sRes2 = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(uri)}&type=track&limit=1`, {headers: {Authorization: `Bearer ${tok2}`}});
                    uri = (await sRes2.json()).tracks?.items[0]?.uri;
                    if (!uri) return "Track not found.";
                }
                const pRes = await fetch("https://api.spotify.com/v1/me/player/play", {method:"PUT", headers:{Authorization: `Bearer ${tok2}`,  "Content-Type":"application/json"}, body:JSON.stringify({uris: [uri]})});
                return pRes.status === 204 ? "Playing!" : pRes.status === 404 ? "No device. Open Spotify." : "Failed.";

            case "pauseSpotify":
                const r = await useSpotifyStore.getState().togglePlayback(false);
                return r.ok ? "Paused." : r.note;

            case "skipSpotifyTrack":
                const sr = await useSpotifyStore.getState().skipNext();
                return sr.ok ? "Skipped." : sr.note;

            case "getCurrentSpotifyTrack":
                const curr = await useSpotifyStore.getState().getCurrentlyPlaying();
                if (!curr?.item) return "Nothing playing.";
                return `${curr.is_playing?"Playing":"Paused"}: "${curr.item.name}" by ${curr.item.artists.map((a:any)=>a.name).join(', ')}`;

3. MODEL UPDATE (Find "model:" in getChatResponse function, around line 285):
   Change: model: "google/gemini-2.0-flash-exp"
   To:     model: "google/gemini-3-pro-preview"
   
   (Do this for BOTH API calls - first call and second call inside tool handling)

4. ALSO UPDATE setUserStatus implementation (lines 198-202):
   Replace with:
                if (messageStore.currentUser) {
                    await messageStore.updateStatus(args.status);
                    if (args.message) await messageStore.updateCustomStatus(args.message);
                    return `Status updated to ${args.status}.`;
                }
