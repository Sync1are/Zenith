import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SparklesIcon } from '../icons/IconComponents';

// Api key
const API_KEY: string = "AIzaSyDvzLie0z1jMUOypmaZmxyckqMA4k42bHA";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    editTask?: Task;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, editTask }) => {
    const [title, setTitle] = useState(editTask?.title || "");
    const [category, setCategory] = useState(editTask?.category || "");
    const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || TaskPriority.MEDIUM);
    const [duration, setDuration] = useState(editTask?.duration || "");

    // Update fields when editTask changes
    useEffect(() => {
        if (editTask) {
            setTitle(editTask.title);
            setCategory(editTask.category);
            setPriority(editTask.priority);
            setDuration(editTask.duration);
        } else {
            setTitle("");
            setCategory("");
            setPriority(TaskPriority.MEDIUM);
            setDuration("");
        }
    }, [editTask]);

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSave({
            title,
            category,
            priority,
            duration,
            ...(editTask && { id: editTask.id, status: editTask.status, isCompleted: editTask.isCompleted })
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#1C1C1E] p-6 rounded-xl border border-gray-800 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">{editTask ? "Edit Task" : "Add Task"}</h2>

                <input
                    className="w-full bg-[#111217] px-3 py-2 rounded border border-gray-700 text-white mb-3"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <input
                    className="w-full bg-[#111217] px-3 py-2 rounded border border-gray-700 text-white mb-3"
                    placeholder="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

                <div className="flex gap-3 mb-4">
                    <select
                        className="flex-1 bg-[#111217] border border-gray-700 text-white rounded px-3 py-2"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    >
                        {Object.values(TaskPriority).map(p => <option key={p}>{p}</option>)}
                    </select>

                    <input
                        className="flex-1 bg-[#111217] border border-gray-700 text-white rounded px-3 py-2"
                        placeholder="45 min"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 bg-gray-700 rounded text-white hover:bg-gray-600 transition" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-orange-600 rounded text-white hover:bg-orange-500 transition"
                        onClick={handleSubmit}
                    >
                        {editTask ? "Update" : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface GeneratePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBatch: (tasks: Task[]) => void;
}

export const GeneratePlanModal: React.FC<GeneratePlanModalProps> = ({ isOpen, onClose, onAddBatch }) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generatePlan = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        if (!API_KEY) {
            setError("⚠️ API Key not configured. Add VITE_GOOGLE_API_KEY to your .env file");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const response = await model.generateContent(`
You are a task planning assistant. Generate a structured task breakdown for the user's goal.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no code blocks.

Format:
{
  "task": {
    "title": "Main task title",
    "category": "Category name",
    "priority": "HIGH or MEDIUM or LOW",
    "subtasks": [
      { "title": "Subtask 1", "duration": "30 min" },
      { "title": "Subtask 2", "duration": "45 min" }
    ]
  }
}

User's goal: ${prompt}

Generate 3-5 actionable subtasks with realistic durations.
            `);

            let text = response.response.text().trim();

            // Remove markdown code blocks if present
            text = text.replace(/``````\n?/g, "").trim();

            // Try to find JSON in the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                text = jsonMatch[0];
            }

            const data = JSON.parse(text);

            if (!data.task || !data.task.title) {
                throw new Error("Invalid response format");
            }

            // Calculate total duration from subtasks
            const totalMinutes = data.task.subtasks.reduce((sum: number, st: any) => {
                const match = st.duration.match(/(\d+)\s*(min|hour)/i);
                if (match) {
                    const value = parseInt(match[1]);
                    const unit = match[2].toLowerCase();
                    return sum + (unit.includes('hour') ? value * 60 : value);
                }
                return sum;
            }, 0);

            const mainTask = {
                id: Date.now(),
                title: data.task.title,
                category: data.task.category,
                priority: data.task.priority as TaskPriority,
                duration: totalMinutes >= 60
                    ? `${Math.floor(totalMinutes / 60)} hours ${totalMinutes % 60} min`
                    : `${totalMinutes} min`,
                status: TaskStatus.TODO,
                isCompleted: false,
                subtasks: data.task.subtasks.map((st: any, index: number) => ({
                    id: Date.now() + index,
                    title: st.title,
                    duration: st.duration,
                    isCompleted: false
                }))
            };

            // Cast to Task[] (assuming mainTask matches Task type)
            onAddBatch([mainTask as any]);
            setPrompt("");
            onClose();

        } catch (err: any) {
            console.error("AI Generation Error:", err);
            setError(
                err.message?.includes("API")
                    ? "⚠️ API Error: Check your API key and quota"
                    : "⚠️ Could not generate tasks. Try rephrasing your prompt."
            );
        }

        setLoading(false);
    };

    const handleClose = () => {
        setPrompt("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={handleClose}>
            <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl text-white font-bold mb-4 flex items-center gap-2">
                    <SparklesIcon className="h-6 w-6 text-indigo-400" />
                    AI Task Planner
                </h2>

                <textarea
                    className="w-full h-32 bg-[#111217] border border-gray-700 text-white rounded p-3 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="Example: Plan my study session for calculus and physics, break down review of electrostatics chapter..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                />

                {error && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-gray-500">
                        💡 Tip: Be specific about your goals for better results
                    </p>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-gray-700 rounded text-white hover:bg-gray-600 transition"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-indigo-600 rounded text-white disabled:opacity-50 hover:bg-indigo-500 transition flex items-center gap-2"
                            disabled={loading || !prompt.trim()}
                            onClick={generatePlan}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-4 w-4" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
